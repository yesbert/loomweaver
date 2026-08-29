import { posix } from 'node:path';
import {
  getProjects,
  readProjectConfiguration,
  Tree,
  updateProjectConfiguration,
} from '@nx/devkit';
import { ensurePostcssPlugin } from '../lib/amend/merge';
import { PostcssAmendment } from '../lib/amend/types';
import { FileMap } from '../lib/generate/types';

export interface ResolvedApp {
  readonly name: string;
  readonly root: string;
}

/**
 * Resolves the application a scaffold drops into. Named explicitly, or — when the workspace holds
 * exactly one buildable application — inferred from it. Anything else is an error naming the
 * candidates, because guessing here would write files into the wrong project.
 *
 * A candidate must have a build target: that build is what serves the weaver's translations and
 * what its specs compile against. E2E projects are applications to Nx but build nothing, so they
 * are never candidates — otherwise the standard `<app>` + `<app>-e2e` pair would defeat inference.
 */
export function resolveApp(tree: Tree, app?: string): ResolvedApp {
  const projects = getProjects(tree);
  if (app) {
    const project = projects.get(app);
    if (!project) {
      throw new Error(`No project named "${app}" in this workspace.`);
    }
    if (project.projectType !== 'application') {
      throw new Error(
        `"${app}" is not an application project — a scaffold drops into an app, not a library.`,
      );
    }
    if (!project.targets?.['build']) {
      throw new Error(
        `"${app}" has no build target, so a scaffold cannot drop into it. Name the application you serve.`,
      );
    }
    return { name: app, root: project.root };
  }
  const applications = [...projects].filter(
    ([, project]) =>
      project.projectType === 'application' && project.targets?.['build'],
  );
  if (applications.length === 1) {
    return { name: applications[0][0], root: applications[0][1].root };
  }
  if (applications.length === 0) {
    throw new Error(
      'This workspace has no application project with a build target. Pass --app with the target project name.',
    );
  }
  throw new Error(
    `This workspace has several applications (${applications
      .map(([name]) => name)
      .join(', ')}). Pass --app to choose one.`,
  );
}

export function workspaceScope(tree: Tree): string | undefined {
  const raw = tree.read('package.json', 'utf-8');
  if (!raw) {
    return undefined;
  }
  const name: unknown = JSON.parse(raw).name;
  if (typeof name !== 'string' || !name.startsWith('@')) {
    return undefined;
  }
  return name.split('/')[0];
}

export function tsconfigPathsFile(tree: Tree): string {
  return tree.exists('tsconfig.base.json')
    ? 'tsconfig.base.json'
    : 'tsconfig.json';
}

export function writeFiles(tree: Tree, root: string, ...maps: FileMap[]): void {
  for (const files of maps) {
    for (const [path, content] of Object.entries(files)) {
      tree.write(`${root}/${path}`, content);
    }
  }
}

export function writeFilesGuarded(
  tree: Tree,
  root: string,
  files: FileMap,
): void {
  for (const [path, content] of Object.entries(files)) {
    const full = `${root}/${path}`;
    if (tree.exists(full)) {
      throw new Error(`A file already exists at ${full}.`);
    }
    tree.write(full, content);
  }
}

export interface I18nAssetsGlob {
  readonly input: string;
  readonly output: string;
}

export function addI18nAssetsGlob(
  tree: Tree,
  app: string,
  glob: I18nAssetsGlob,
): void {
  const project = readProjectConfiguration(tree, app);
  const assets: unknown = project.targets?.['build']?.options?.assets;
  if (!Array.isArray(assets)) {
    return;
  }
  const present = assets.some(
    (asset) =>
      typeof asset === 'object' &&
      asset !== null &&
      (asset as { input?: string }).input === glob.input,
  );
  if (present) {
    return;
  }
  assets.push({ glob: '**/*.json', input: glob.input, output: glob.output });
  updateProjectConfiguration(tree, app, project);
}

function usesTailwind(css: string): boolean {
  return css.split('\n').some((line) => {
    const directive = line.trimStart();
    return (
      /^@import\s+['"]tailwindcss['"]/.test(directive) ||
      /^@source\s/.test(directive)
    );
  });
}

/**
 * Registers a library's sources with the application's Tailwind entry stylesheet, so utilities
 * written in that library's templates are emitted. Tailwind 4 also detects sources automatically,
 * and in a plain workspace that already covers a sibling library — but that detection depends on
 * where it resolves the project root and on `.gitignore`, whereas `@source` is a statement. The
 * scaffolded `@source './'` covers the application alone, so nothing else names the library.
 *
 * A no-op when the application does not run Tailwind (the `--styles precompiled` path imports a
 * stylesheet we compiled, where a `@source` would do nothing), when the build target names no
 * stylesheet, or when the source is already listed.
 */
export function addTailwindSource(
  tree: Tree,
  app: string,
  libSourceRoot: string,
): void {
  const project = readProjectConfiguration(tree, app);
  const stylesheet = entryStylesheet(
    project.targets?.['build']?.options?.styles,
  );
  if (!stylesheet) {
    return;
  }
  const css = tree.read(stylesheet, 'utf-8');
  if (!css || !usesTailwind(css)) {
    return;
  }
  const from = posix.dirname(stylesheet);
  const target = posix.relative(from, libSourceRoot);
  if (new RegExp(String.raw`@source\s+['"]${target}/?['"]`).test(css)) {
    return;
  }
  tree.write(stylesheet, `${css.trimEnd()}\n\n@source '${target}';\n`);
}

function entryStylesheet(styles: unknown): string | undefined {
  if (!Array.isArray(styles)) {
    return undefined;
  }
  for (const entry of styles) {
    if (typeof entry === 'string' && entry.endsWith('.css')) {
      return entry;
    }
    if (typeof entry === 'object' && entry !== null) {
      const input = (entry as { input?: unknown }).input;
      if (typeof input === 'string' && input.endsWith('.css')) {
        return input;
      }
    }
  }
  return undefined;
}

export function addPostcssPlugin(
  tree: Tree,
  amendment: PostcssAmendment,
): void {
  const codeConfigs = [
    'postcss.config.js',
    'postcss.config.mjs',
    'postcss.config.cjs',
    '.postcssrc.js',
  ];
  if (codeConfigs.some((name) => tree.exists(name))) {
    return;
  }
  const existing = tree.exists(amendment.file)
    ? (JSON.parse(tree.read(amendment.file, 'utf-8') ?? '{}') as unknown)
    : undefined;
  const result = ensurePostcssPlugin(existing, amendment);
  if (result.added.length === 0) {
    return;
  }
  tree.write(amendment.file, `${JSON.stringify(result.value, null, 2)}\n`);
}

import { posix } from 'node:path';
import {
  getProjects,
  logger,
  ProjectConfiguration,
  readProjectConfiguration,
  Tree,
  updateProjectConfiguration,
} from '@nx/devkit';
import {
  ensurePostcssPlugin,
  ensureStylesheetSource,
} from '../lib/amend/merge';
import { composeLines, composePlugin } from '../lib/amend/compose';
import { ComposePluginAmendment, PostcssAmendment } from '../lib/amend/types';
import { FileMap } from '../lib/generate/types';

export interface ResolvedApp {
  readonly name: string;
  readonly root: string;
  readonly prefix?: string;
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
    return resolved(app, project);
  }
  const apps = buildableApps(tree);
  if (apps.length === 1) {
    return resolved(...apps[0]);
  }
  if (apps.length === 0) {
    throw new Error(
      'This workspace has no application project with a build target. Pass --app with the target project name.',
    );
  }
  throw new Error(
    `This workspace has several applications (${apps
      .map(([name]) => name)
      .join(', ')}). Pass --app to choose one.`,
  );
}

function resolved(name: string, project: ProjectConfiguration): ResolvedApp {
  return { name, root: project.root, prefix: declaredPrefix(project) };
}

function declaredPrefix(project: ProjectConfiguration): string | undefined {
  const { prefix } = project as ProjectConfiguration & { prefix?: unknown };
  return typeof prefix === 'string' && prefix.trim() ? prefix.trim() : undefined;
}

export function buildableApps(tree: Tree): [string, ProjectConfiguration][] {
  return [...getProjects(tree)].filter(
    ([, project]) =>
      project.projectType === 'application' && project.targets?.['build'],
  );
}

export function workspaceScope(tree: Tree): string | undefined {
  const raw = tree.read('package.json', 'utf8');
  if (!raw) {
    return undefined;
  }
  const name: unknown = JSON.parse(raw).name;
  if (typeof name !== 'string' || !name.startsWith('@')) {
    return undefined;
  }
  return name.split('/', 1)[0];
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
  librarySourceRoot: string,
): void {
  const project = readProjectConfiguration(tree, app);
  const stylesheet = entryStylesheet(
    project.targets?.['build']?.options?.styles,
  );
  if (!stylesheet) {
    return;
  }
  const css = tree.read(stylesheet, 'utf8');
  if (!css || !usesTailwind(css)) {
    return;
  }
  const source = posix.relative(posix.dirname(stylesheet), librarySourceRoot);
  const next = ensureStylesheetSource(css, source);
  if (next !== css) {
    tree.write(stylesheet, next);
  }
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
  const inTheWay = codeConfigs.find((name) => tree.exists(name));
  if (inTheWay) {
    logger.warn(
      `${inTheWay} is written as code and cannot be merged into, so add ${amendment.plugin} to it yourself; until then the stylesheet emits no utility class and the workbench renders unstyled.`,
    );
    return;
  }
  const existing = tree.exists(amendment.file)
    ? (JSON.parse(tree.read(amendment.file, 'utf8') ?? '{}') as unknown)
    : undefined;
  const result = ensurePostcssPlugin(existing, amendment);
  for (const reason of result.declined) {
    logger.warn(
      `${reason}, so ${amendment.plugin} was not added; until it is, the workbench renders unstyled.`,
    );
  }
  if (result.added.length === 0) {
    return;
  }
  tree.write(amendment.file, `${JSON.stringify(result.value, null, 2)}\n`);
}

export function composeIntoAppConfig(
  tree: Tree,
  appRoot: string,
  amendment: ComposePluginAmendment,
  importPath: string,
): void {
  const file = `${appRoot}/src/app/app.config.ts`;
  const source = tree.read(file, 'utf8');
  const result =
    source === null ? undefined : composePlugin(source, amendment, importPath);
  if (!result?.composed) {
    const state =
      source === null
        ? 'does not exist'
        : 'no longer presents the shape the distribution scaffold generated';
    logger.warn(
      `${file} ${state}, so ${amendment.id} was NOT registered and none of its contributions will appear. Add these to it yourself: ${composeLines(amendment, importPath).join(' ')}`,
    );
    return;
  }
  if (result.source !== source) {
    tree.write(file, result.source);
  }
}

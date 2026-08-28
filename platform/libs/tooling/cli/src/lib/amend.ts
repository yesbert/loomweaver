import {
  Amendment,
  BuildTargetAmendment,
  composeLines,
  ComposePluginAmendment,
  composePlugin,
  ensureBuildTarget,
  ensurePostcssPlugin,
  ensureStylesheetSource,
  PostcssAmendment,
  StylesheetSourceAmendment,
} from '@loomweaver/devkit';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, posix, relative, resolve, sep } from 'node:path';
import {
  BuildProject,
  findWorkspace,
  readJsonFile,
  resolveBuildProject,
  Workspace,
  WorkspaceError,
} from './workspace';

export interface PlannedAmendment {
  readonly file: string;
  readonly display: string;
  readonly added: readonly string[];
  readonly content: string;
}

export interface AmendPlan {
  readonly amendments: readonly PlannedAmendment[];
  readonly remaining: readonly string[];
}

const JS_POSTCSS_CONFIGS = [
  'postcss.config.js',
  'postcss.config.mjs',
  'postcss.config.cjs',
  '.postcssrc.js',
];

export function planAmend(
  amendments: readonly Amendment[],
  target: string,
): AmendPlan {
  if (amendments.length === 0) {
    return { amendments: [], remaining: [] };
  }
  const workspace = findWorkspace(target);
  if (!workspace) {
    return {
      amendments: [],
      remaining: [
        'No workspace was found above the target directory, so nothing could be wired here. Add it ' +
          `by hand, or generate inside the workspace: ${amendments.map(describe).join(' · ')}`,
      ],
    };
  }
  return new Amender(workspace, target).plan(amendments);
}

export function applyAmend(plan: AmendPlan): void {
  for (const amendment of plan.amendments) {
    writeFileSync(amendment.file, amendment.content, 'utf8');
  }
}

export function describe(amendment: Amendment): string {
  if (amendment.kind === 'postcss') {
    return `${amendment.file} naming ${amendment.plugin}, without which the stylesheet emits no utility class and the workbench renders unstyled`;
  }
  if (amendment.kind === 'stylesheet-source') {
    return `an @source entry for '${amendment.sourceRoot}' in the entry stylesheet, without which none of that code's utilities are emitted`;
  }
  if (amendment.kind === 'compose-plugin') {
    return `${amendment.id} registered in the composition root, without which none of its contributions appear`;
  }
  const parts: string[] = [];
  if (amendment.styles.length > 0) {
    parts.push(`the stylesheet ${amendment.styles.join(', ')}`);
  }
  if (amendment.assets.length > 0) {
    parts.push(
      `assets for ${amendment.assets.map((asset) => asset.input).join(', ')}`,
    );
  }
  if (amendment.serviceWorker) {
    parts.push(`serviceWorker ${amendment.serviceWorker}`);
  }
  if (amendment.inlineCritical !== undefined) {
    parts.push(
      `production optimization.styles.inlineCritical ${amendment.inlineCritical}, without which a release build renders unstyled under the generated content-security policy`,
    );
  }
  return `a build target carrying ${parts.join('; ')}`;
}

class Amender {
  private readonly planned: PlannedAmendment[] = [];
  private readonly remaining: string[] = [];
  private readonly configAdded: string[] = [];
  private config?: Record<string, unknown>;
  private project?: BuildProject;

  constructor(
    private readonly workspace: Workspace,
    private readonly target: string,
  ) {}

  plan(amendments: readonly Amendment[]): AmendPlan {
    for (const amendment of amendments) {
      this.planOne(amendment);
    }
    this.flushConfig();
    return { amendments: this.planned, remaining: this.remaining };
  }

  private planOne(amendment: Amendment): void {
    if (amendment.kind === 'postcss') {
      this.planPostcss(amendment);
      return;
    }
    if (this.workspace.kind !== 'angular') {
      this.remaining.push(this.nonAngularNote(amendment));
      return;
    }
    const project = this.resolveProject();
    if (!project) {
      return;
    }
    if (amendment.kind === 'build-target') {
      this.planBuildTarget(amendment, project);
    } else if (amendment.kind === 'stylesheet-source') {
      this.planStylesheetSource(amendment, project);
    } else {
      this.planComposePlugin(amendment, project);
    }
  }

  private planPostcss(amendment: PostcssAmendment): void {
    const inTheWay = JS_POSTCSS_CONFIGS.find((name) =>
      existsSync(resolve(this.workspace.root, name)),
    );
    if (inTheWay) {
      this.remaining.push(
        `${inTheWay} is written as code and cannot be merged into, so add ${amendment.plugin} to it yourself; until then the stylesheet emits no utility class and the workbench renders unstyled.`,
      );
      return;
    }
    const file = resolve(this.workspace.root, amendment.file);
    const result = ensurePostcssPlugin(
      existsSync(file) ? readJsonFile(file) : undefined,
      amendment,
    );
    this.remaining.push(...result.declined);
    if (result.added.length === 0) {
      return;
    }
    this.planned.push({
      file,
      display: this.displayName(file),
      added: result.added,
      content: `${JSON.stringify(result.value, null, 2)}\n`,
    });
  }

  private planBuildTarget(
    amendment: BuildTargetAmendment,
    project: BuildProject,
  ): void {
    const target = this.buildTarget(project.name);
    if (!target) {
      this.remaining.push(
        `${project.name} has no build target to wire, so add it by hand: ${describe(amendment)}.`,
      );
      return;
    }
    const result = ensureBuildTarget(target.value, amendment, project.root);
    this.remaining.push(...result.declined);
    if (result.added.length === 0) {
      return;
    }
    target.set(result.value);
    this.configAdded.push(...result.added);
  }

  private planStylesheetSource(
    amendment: StylesheetSourceAmendment,
    project: BuildProject,
  ): void {
    const entry = this.entryStylesheet(project);
    if (!entry || !existsSync(entry)) {
      this.remaining.push(
        `No entry stylesheet is wired for ${project.name}, so add it yourself: ${describe(amendment)}.`,
      );
      return;
    }
    const css = readFileSync(entry, 'utf8');
    if (!/@import\s+['"]tailwindcss['"]/.test(css)) {
      return;
    }
    const source = posix.relative(
      this.displayName(dirname(entry)),
      amendment.sourceRoot,
    );
    const next = ensureStylesheetSource(css, source);
    if (next === css) {
      return;
    }
    this.planned.push({
      file: entry,
      display: this.displayName(entry),
      added: [`@source '${source}'`],
      content: next,
    });
  }

  private planComposePlugin(
    amendment: ComposePluginAmendment,
    project: BuildProject,
  ): void {
    const root = resolve(
      this.workspace.root,
      project.root,
      'src/app/app.config.ts',
    );
    const importPath = relativeImport(
      this.displayName(dirname(root)),
      amendment.sourceRoot,
    );
    if (!existsSync(root)) {
      this.remaining.push(this.composeNote(amendment, importPath));
      return;
    }
    const source = readFileSync(root, 'utf8');
    const result = composePlugin(source, amendment, importPath);
    if (!result.composed) {
      this.remaining.push(this.composeNote(amendment, importPath));
      return;
    }
    if (result.source === source) {
      return;
    }
    this.planned.push({
      file: root,
      display: this.displayName(root),
      added: [`${amendment.symbol}, its translations and its capability grants`],
      content: result.source,
    });
  }

  private composeNote(
    amendment: ComposePluginAmendment,
    importPath: string,
  ): string {
    return (
      `The composition root no longer presents the shape this scaffold generated, so ${amendment.id} ` +
      'was NOT registered and none of its contributions will appear. Add these to it yourself: ' +
      composeLines(amendment, importPath).join(' ')
    );
  }

  private flushConfig(): void {
    if (this.configAdded.length === 0 || !this.config) {
      return;
    }
    const file = this.workspace.configFile as string;
    this.planned.push({
      file,
      display: this.displayName(file),
      added: this.configAdded,
      content: `${JSON.stringify(this.config, null, 2)}\n`,
    });
  }

  private resolveProject(): BuildProject | undefined {
    if (this.project) {
      return this.project;
    }
    try {
      this.project = resolveBuildProject(this.workspace, this.target);
      return this.project;
    } catch (error) {
      this.remaining.push((error as WorkspaceError).message);
      return undefined;
    }
  }

  private readConfig(): Record<string, unknown> {
    this.config ??= readJsonFile(this.workspace.configFile as string) as Record<
      string,
      unknown
    >;
    return this.config;
  }

  private buildTarget(name: string): TargetRef | undefined {
    const project = asObject(asObject(this.readConfig()['projects'])?.[name]);
    if (!project) {
      return undefined;
    }
    for (const key of ['architect', 'targets']) {
      const targets = asObject(project[key]);
      if (targets?.['build'] !== undefined) {
        return {
          value: targets['build'],
          set: (next) => {
            targets['build'] = next;
          },
        };
      }
    }
    return undefined;
  }

  private entryStylesheet(project: BuildProject): string | undefined {
    const styles = asObject(asObject(this.buildTarget(project.name)?.value)?.['options'])?.[
      'styles'
    ];
    if (!Array.isArray(styles)) {
      return undefined;
    }
    const entry = styles.find(
      (style): style is string => typeof style === 'string' && style.endsWith('.css'),
    );
    return entry === undefined ? undefined : resolve(this.workspace.root, entry);
  }

  private nonAngularNote(amendment: Amendment): string {
    const where =
      this.workspace.kind === 'nx'
        ? "the project's own project.json"
        : 'your build configuration';
    return `This route wires an Angular CLI workspace only, so add ${describe(amendment)} to ${where} yourself. The Nx generator does it for you.`;
  }

  private displayName(file: string): string {
    const inside = relative(this.workspace.root, file).split(sep).join('/');
    return inside.startsWith('..') ? file : inside;
  }
}

interface TargetRef {
  readonly value: unknown;
  set(next: unknown): void;
}

function asObject(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function relativeImport(fromDir: string, sourceRoot: string): string {
  const path = posix.relative(fromDir, sourceRoot);
  return path.startsWith('.') ? path : `./${path}`;
}

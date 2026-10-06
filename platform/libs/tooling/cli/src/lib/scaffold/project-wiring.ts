import {
  asObject,
  BuildTargetAmendment,
  composeLines,
  ComposePluginAmendment,
  composePlugin,
  composeProviders,
  ComposeProviderAmendment,
  describeAmendment,
  ensureStylesheetImport,
  importSpecifier,
  keptNote,
  moduleImport,
  providerLines,
  StylesheetImportAmendment,
  ensureBuildTarget,
  ensureStylesheetSource,
  entryStylesheet,
  relativeImport,
  StylesheetSourceAmendment,
  usesTailwind,
} from '@loomweaver/devkit';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, posix, resolve } from 'node:path';
import { BuildProject, buildTargetOf } from '../angular-config';
import {
  ConfiguredWorkspace,
  readJsonFile,
  resolveBuildProject,
  WorkspaceError,
} from '../workspace';
import { AmendLog } from './amend-log';

export type ProjectAmendment =
  | BuildTargetAmendment
  | StylesheetSourceAmendment
  | StylesheetImportAmendment
  | ComposePluginAmendment
  | ComposeProviderAmendment;

export class ProjectWiring {
  private readonly configAdded: string[] = [];
  private config?: Record<string, unknown>;
  private projectResolved = false;
  private readonly pendingCss = new Map<string, string>();
  private project?: BuildProject;

  constructor(
    private readonly workspace: ConfiguredWorkspace,
    private readonly target: string,
    private readonly log: AmendLog,
  ) {}

  plan(amendment: ProjectAmendment): void {
    const project = this.resolveProject();
    if (!project) {
      return;
    }
    switch (amendment.kind) {
      case 'build-target': {
        this.planBuildTarget(amendment, project);
        return;
      }
      case 'stylesheet-source': {
        this.planStylesheetSource(amendment, project);
        return;
      }
      case 'stylesheet-import': {
        this.planStylesheetImport(amendment, project);
        return;
      }
      case 'compose-plugin': {
        this.planComposePlugin(amendment, project);
        return;
      }
      case 'compose-provider': {
        this.planComposeProviders(amendment, project);
      }
    }
  }

  flush(): void {
    if (this.configAdded.length === 0 || !this.config) {
      return;
    }
    this.log.plan(
      this.workspace.configFile,
      this.configAdded,
      `${JSON.stringify(this.config, null, 2)}\n`,
    );
  }

  private planBuildTarget(
    amendment: BuildTargetAmendment,
    project: BuildProject,
  ): void {
    const target = buildTargetOf(this.readConfig(), project.name);
    if (!target) {
      this.log.note(
        `${project.name} has no build target to wire, so add it by hand: ${describeAmendment(amendment)}.`,
      );
      return;
    }
    const result = ensureBuildTarget(target.value, amendment, project.root);
    this.log.note(...result.declined);
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
      this.log.note(
        `No entry stylesheet is wired for ${project.name}, so add it yourself: ${describeAmendment(amendment)}.`,
      );
      return;
    }
    const css = readFileSync(entry, 'utf8');
    if (!usesTailwind(css)) {
      return;
    }
    const source =
      posix.relative(this.log.displayName(dirname(entry)), amendment.sourceRoot) || '.';
    const next = ensureStylesheetSource(css, source);
    if (next === css) {
      return;
    }
    this.log.plan(entry, [`@source '${source}'`], next);
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
      this.log.displayName(dirname(root)),
      amendment.sourceRoot,
    );
    if (!existsSync(root)) {
      this.log.note(composeNote(amendment, importPath));
      return;
    }
    const source = readFileSync(root, 'utf8');
    const result = composePlugin(source, amendment, importPath);
    if (!result.composed) {
      this.log.note(composeNote(amendment, importPath));
      return;
    }
    if (result.source === source) {
      return;
    }
    this.log.plan(
      root,
      [
        `${amendment.symbol}, its translations and its capability grants`,
        ...(amendment.providers ?? [])
          .filter((provider) => !result.kept.includes(provider.line))
          .map((provider) => provider.line.replace(/,$/, '')),
        ...result.kept.map((line) => keptNote(line)),
      ],
      result.source,
    );
  }

  private planStylesheetImport(
    amendment: StylesheetImportAmendment,
    project: BuildProject,
  ): void {
    const entry = this.entryStylesheet(project);
    if (!entry || !existsSync(entry)) {
      this.log.note(
        `No entry stylesheet is wired for ${project.name}, so add it yourself: ${describeAmendment(amendment)}`,
      );
      return;
    }
    const css = this.pendingCss.get(entry) ?? readFileSync(entry, 'utf8');
    const displayed = this.log.displayName(entry);
    const result = ensureStylesheetImport(
      css,
      importSpecifier(displayed, amendment.file),
      amendment.after,
    );
    if (!result.anchored) {
      this.log.note(
        `${displayed} does not import ${amendment.after}, so ${amendment.file} was imported after its last import instead; check that it still comes after the shell's styles.`,
      );
    }
    if (result.css === css) {
      return;
    }
    this.pendingCss.set(entry, result.css);
    this.log.plan(entry, [`@import '${importSpecifier(displayed, amendment.file)}'`], result.css);
  }

  private planComposeProviders(
    amendment: ComposeProviderAmendment,
    project: BuildProject,
  ): void {
    const root = resolve(this.workspace.root, project.root, 'src/app/app.config.ts');
    const importPath = moduleImport(this.log.displayName(dirname(root)), amendment.module);
    const source = existsSync(root) ? readFileSync(root, 'utf8') : undefined;
    const result =
      source === undefined ? undefined : composeProviders(source, amendment, importPath);
    if (!result?.composed) {
      this.log.note(
        `The composition root no longer presents the shape this scaffold generated, so these were NOT added. ${amendment.without} Add them yourself: ${providerLines(amendment, importPath).join(' ')}`,
      );
      return;
    }
    const kept = result.kept.map((line) => keptNote(line));
    if (result.source === source) {
      this.log.note(...kept.map((note) => `${note}; replace it to use the generated one.`));
      return;
    }
    this.log.plan(
      root,
      [
        ...amendment.providers
          .filter((provider) => !result.kept.includes(provider.line))
          .map((provider) => provider.line.replace(/,$/, '')),
        ...kept,
      ],
      result.source,
    );
  }

  private resolveProject(): BuildProject | undefined {
    if (!this.projectResolved) {
      this.projectResolved = true;
      try {
        this.project = resolveBuildProject(this.workspace, this.target);
      } catch (error) {
        this.log.note((error as WorkspaceError).message);
      }
    }
    return this.project;
  }

  private readConfig(): Record<string, unknown> {
    this.config ??= asObject(readJsonFile(this.workspace.configFile)) ?? {};
    return this.config;
  }

  private entryStylesheet(project: BuildProject): string | undefined {
    const target = buildTargetOf(this.readConfig(), project.name)?.value;
    const entry = entryStylesheet(asObject(asObject(target)?.['options'])?.['styles']);
    return entry === undefined ? undefined : resolve(this.workspace.root, entry);
  }
}

function composeNote(
  amendment: ComposePluginAmendment,
  importPath: string,
): string {
  return (
    `The composition root no longer presents the shape this scaffold generated, so ${amendment.id} ` +
    'was NOT registered and none of its contributions will appear. Add these to it yourself: ' +
    composeLines(amendment, importPath).join(' ')
  );
}



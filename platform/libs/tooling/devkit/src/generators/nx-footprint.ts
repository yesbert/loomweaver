import {
  asObject,
  ensureDependency,
  entryStylesheet,
  joinProjectPath,
  parseWorkspaceJson,
  usesTailwind,
} from '../lib/amend/merge';
import {
  ensurePostcssPlugin,
  postcssFileTheBuildReads,
  postcssWrittenAsCode,
} from '../lib/amend/postcss';
import { Amendment, PostcssAmendment } from '../lib/amend/types';
import { ScaffoldValues } from '../lib/scaffolds/scaffold-values';
import { distributionScaffold } from '../recipes/angular-distribution/scaffold';
import { weaverScaffold } from '../recipes/angular-weaver/scaffold';
import { nxDistribution, nxDistributionFiles } from './distribution/nx-files';
import { nxWeaverFiles, nxWeaverProject } from './weaver/nx-files';

export interface NxApplication {
  readonly name: string;
  readonly root: string;
}

export type ReadWorkspaceFile = (path: string) => string | undefined;

/**
 * Every workspace file the distribution generator creates or changes when it composes into the
 * application given, as paths relative to the workspace root. A route that cannot run the
 * generator yet uses this to say what running it will touch.
 */
export function nxDistributionFootprint(
  app: NxApplication,
  values: ScaffoldValues,
  read: ReadWorkspaceFile,
): readonly string[] {
  const inApp = (path: string) => joinProjectPath(app.root, path);
  const placed = { ...values, name: app.name, directory: app.root };
  const { 'project.json': project, ...configuration } = nxDistributionFiles(
    nxDistribution({ name: app.name, directory: app.root }),
  );
  return unique([
    ...Object.keys(distributionScaffold.build(placed)).map((path) => inApp(path)),
    ...Object.keys(configuration)
      .map((path) => inApp(path))
      .filter((path) => read(path) === undefined),
    ...(project ? [inApp('project.json')] : []),
    ...amendedFiles(distributionScaffold.amend?.(placed) ?? [], app, read),
  ]);
}

/**
 * What the distribution generator will say about a step it leaves undone in the application given:
 * today, that it writes no style pipeline beside one written as a script, and why.
 */
export function nxDistributionNotes(
  app: NxApplication,
  values: ScaffoldValues,
  read: ReadWorkspaceFile,
): readonly string[] {
  const placed = { ...values, name: app.name, directory: app.root };
  return (distributionScaffold.amend?.(placed) ?? [])
    .filter((amendment) => amendment.kind === 'postcss')
    .map((amendment) => stylePipeline(amendment, app, read).leftAlone)
    .filter((note): note is string => note !== undefined);
}

/** The project root the weaver generator gives a weaver that is placed nowhere in particular. */
export function nxWeaverRoot(id: string): string {
  return nxWeaverProject({ id }).projectRoot;
}

/**
 * Every workspace file the weaver generator creates or changes when it composes the weaver into
 * the application given, as paths relative to the workspace root.
 */
export function nxWeaverFootprint(
  app: NxApplication,
  values: ScaffoldValues,
  read: ReadWorkspaceFile,
): readonly string[] {
  const baseTsconfig =
    read('tsconfig.base.json') === undefined ? 'tsconfig.json' : 'tsconfig.base.json';
  const project = nxWeaverProject({
    id: String(values['id']),
    buildTarget: `${app.name}:build:development`,
    baseTsconfig,
  });
  const placed = { ...values, directory: project.projectRoot };
  return unique([
    ...Object.keys({ ...weaverScaffold.build(placed), ...nxWeaverFiles(project) }).map(
      (path) => joinProjectPath(project.projectRoot, path),
    ),
    baseTsconfig,
    ...amendedFiles(weaverScaffold.amend?.(placed) ?? [], app, read),
  ]);
}

function amendedFiles(
  amendments: readonly Amendment[],
  app: NxApplication,
  read: ReadWorkspaceFile,
): string[] {
  return amendments
    .map((amendment) => amendedFile(amendment, app, read))
    .filter((path): path is string => path !== undefined);
}

function amendedFile(
  amendment: Amendment,
  app: NxApplication,
  read: ReadWorkspaceFile,
): string | undefined {
  switch (amendment.kind) {
    case 'postcss': {
      return stylePipeline(amendment, app, read).written;
    }
    case 'package': {
      const added = ensureDependency(parsed('package.json', read), amendment).added;
      return added.length > 0 ? 'package.json' : undefined;
    }
    case 'build-target': {
      return joinProjectPath(app.root, 'project.json');
    }
    case 'stylesheet-source': {
      const stylesheet = stylesheetOf(app, read);
      return usesTailwind(read(stylesheet) ?? '') ? stylesheet : undefined;
    }
    case 'stylesheet-import': {
      return stylesheetOf(app, read);
    }
    case 'compose-plugin':
    case 'compose-provider': {
      const compositionRoot = joinProjectPath(app.root, 'src/app/app.config.ts');
      return read(compositionRoot) === undefined ? undefined : compositionRoot;
    }
  }
}

function stylePipeline(
  amendment: PostcssAmendment,
  app: NxApplication,
  read: ReadWorkspaceFile,
): { readonly written?: string; readonly leftAlone?: string } {
  const exists = (name: string) => read(name) !== undefined;
  const file = postcssFileTheBuildReads(exists, amendment, app.root);
  if (ensurePostcssPlugin(parsed(file, read), amendment).added.length === 0) {
    return {};
  }
  const leftAlone = postcssWrittenAsCode(exists, amendment, app.root);
  return leftAlone === undefined ? { written: file } : { leftAlone };
}

function stylesheetOf(app: NxApplication, read: ReadWorkspaceFile): string {
  const project = asObject(parsed(joinProjectPath(app.root, 'project.json'), read));
  const build = asObject(asObject(project?.['targets'])?.['build']);
  return (
    entryStylesheet(asObject(build?.['options'])?.['styles']) ??
    joinProjectPath(app.root, 'src/styles.css')
  );
}

function parsed(path: string, read: ReadWorkspaceFile): unknown {
  const json = read(path);
  return json === undefined
    ? undefined
    : parseWorkspaceJson(
        path,
        json,
        'so what the generators would change cannot be told',
      );
}

function unique(paths: readonly string[]): readonly string[] {
  return [...new Set(paths)];
}

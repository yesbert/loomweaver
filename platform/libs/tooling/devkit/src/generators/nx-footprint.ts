import {
  asObject,
  ensureDependency,
  entryStylesheet,
  joinProjectPath,
  usesTailwind,
} from '../lib/amend/merge';
import {
  ensurePostcssPlugin,
  postcssFileTheBuildReads,
  postcssWrittenAsCode,
} from '../lib/amend/postcss';
import { Amendment } from '../lib/amend/types';
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
      const exists = (name: string) => read(name) !== undefined;
      const file = postcssFileTheBuildReads(exists, amendment, app.root);
      const added = ensurePostcssPlugin(parsed(file, read), amendment).added;
      const leftAlone = postcssWrittenAsCode(exists, amendment, app.root) !== undefined;
      return added.length > 0 && !leftAlone ? file : undefined;
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
  if (json === undefined) {
    return undefined;
  }
  try {
    return JSON.parse(json);
  } catch (error) {
    throw new Error(
      `${path} is not valid JSON, so what the generators would change cannot be told: ${(error as Error).message}`,
      { cause: error },
    );
  }
}

function unique(paths: readonly string[]): readonly string[] {
  return [...new Set(paths)];
}

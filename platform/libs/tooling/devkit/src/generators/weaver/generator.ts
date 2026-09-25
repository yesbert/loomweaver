import {
  addDependenciesToPackageJson,
  formatFiles,
  GeneratorCallback,
  logger,
  Tree,
  updateJson,
} from '@nx/devkit';
import { Amendment, ComposePluginAmendment } from '../../lib/amend/types';
import { generate } from '../../lib/generate/generate';
import {
  addI18nAssetsGlob,
  addTailwindSource,
  buildableApps,
  composeIntoAppConfig,
  resolveApp,
  ResolvedApp,
  tsconfigPathsFile,
  workspaceScope,
  writeFiles,
} from '../workspace-tree';
import { weaverAmendments } from '../../recipes/angular-weaver/amendments';
import { angularWeaver } from '../../recipes/angular-weaver/recipe';
import { nxWeaverFiles, nxWeaverProject } from './nx-files';
import { WeaverGeneratorSchema } from './schema';

export async function weaverGenerator(
  tree: Tree,
  options: WeaverGeneratorSchema,
): Promise<GeneratorCallback | void> {
  const baseTsconfig = tsconfigPathsFile(tree);
  const resolved = appToComposeInto(tree, options);
  const app = resolved?.name;
  const project = nxWeaverProject({
    id: options.id,
    projectName: options.projectName,
    directory: options.directory,
    importPath: options.importPath,
    scope: workspaceScope(tree),
    tags: options.tags?.split(',').map((tag) => tag.trim()),
    prefix: options.prefix,
    buildTarget:
      app && options.unitTestRunner !== 'none'
        ? `${app}:build:development`
        : undefined,
    baseTsconfig,
  });
  if (tree.exists(`${project.projectRoot}/project.json`)) {
    throw new Error(`A project already exists at ${project.projectRoot}.`);
  }

  const input = {
    id: options.id,
    name: options.name,
    prefix: project.prefix,
    importPath: project.importPath,
    features: {
      command: options.command,
      menu: options.menu,
      settings: options.settings,
      access: options.access,
      shortcut: options.shortcut,
      barItem: options.barItem,
      about: options.about,
      instanceable: options.instanceable,
      container: options.container,
      agent: options.agent,
      spec: options.spec,
    },
  };
  const source = generate(angularWeaver, input);
  writeFiles(tree, project.projectRoot, source, nxWeaverFiles(project));

  updateJson(tree, baseTsconfig, (json) => {
    json.compilerOptions ??= {};
    json.compilerOptions.paths ??= {};
    json.compilerOptions.paths[project.importPath] = [
      `./${project.projectRoot}/src/index.ts`,
    ];
    return json;
  });

  const amendments = weaverAmendments(input, project.projectRoot);
  if (resolved) {
    addI18nAssetsGlob(tree, resolved.name, {
      input: `${project.projectRoot}/src/lib/i18n`,
      output: `i18n/${options.id}`,
    });
    addTailwindSource(tree, resolved.name, `${project.projectRoot}/src`);
    composeIntoApp(tree, resolved.root, amendments, project.importPath);
  }

  const installed = addPackages(tree, amendments);

  await formatFiles(tree);
  return installed;
}

function addPackages(
  tree: Tree,
  amendments: readonly Amendment[],
): GeneratorCallback | undefined {
  const wanted: Record<string, string> = {};
  for (const amendment of amendments) {
    if (amendment.kind === 'package') {
      wanted[amendment.name] = amendment.version;
    }
  }
  return Object.keys(wanted).length === 0
    ? undefined
    : addDependenciesToPackageJson(tree, wanted, {});
}

function composeIntoApp(
  tree: Tree,
  appRoot: string,
  amendments: readonly Amendment[],
  importPath: string,
): void {
  const amendment = amendments.find(
    (candidate): candidate is ComposePluginAmendment =>
      candidate.kind === 'compose-plugin',
  );
  if (amendment) {
    composeIntoAppConfig(tree, appRoot, amendment, importPath);
  }
}

function appToComposeInto(
  tree: Tree,
  options: WeaverGeneratorSchema,
): ResolvedApp | undefined {
  if (
    options.unitTestRunner !== 'none' ||
    options.app !== undefined ||
    buildableApps(tree).length > 0
  ) {
    return resolveApp(tree, options.app);
  }
  logger.warn(
    `This workspace has no application with a build target, so ${options.id} was generated but not composed into one. Run the generator again with --app once there is one.`,
  );
  return undefined;
}

export default weaverGenerator;

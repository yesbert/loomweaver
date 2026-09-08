import {
  addDependenciesToPackageJson,
  formatFiles,
  GeneratorCallback,
  logger,
  Tree,
  updateJson,
} from '@nx/devkit';
import { composeLines, composePlugin } from '../../lib/amend/compose';
import { Amendment, ComposePluginAmendment } from '../../lib/amend/types';
import { generate } from '../../lib/generate/generate';
import {
  addI18nAssetsGlob,
  addTailwindSource,
  resolveApp,
  tsconfigPathsFile,
  workspaceScope,
  writeFiles,
} from '../shared';
import { weaverAmendments } from '../../recipes/angular-weaver/amendments';
import { angularWeaver } from '../../recipes/angular-weaver/recipe';
import { nxWeaverFiles, nxWeaverProject } from './nx-files';
import { WeaverGeneratorSchema } from './schema';

export async function weaverGenerator(
  tree: Tree,
  options: WeaverGeneratorSchema,
): Promise<GeneratorCallback | void> {
  const baseTsconfig = tsconfigPathsFile(tree);
  const resolved = appFor(tree, options);
  const app = resolved?.name;
  const project = nxWeaverProject({
    id: options.id,
    projectName: options.projectName,
    directory: options.directory,
    importPath: options.importPath,
    scope: workspaceScope(tree),
    tags: options.tags?.split(',').map((tag) => tag.trim()),
    prefix: options.prefix,
    buildTarget: app ? `${app}:build:development` : undefined,
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
  const file = `${appRoot}/src/app/app.config.ts`;
  const source = tree.read(file, 'utf8');
  if (!amendment || source === null) {
    return;
  }
  const result = composePlugin(source, amendment, importPath);
  if (result.composed) {
    if (result.source !== source) {
      tree.write(file, result.source);
    }
    return;
  }
  logger.warn(
    `${file} no longer presents the shape the distribution scaffold generated, so ${amendment.id} was NOT registered and none of its contributions will appear. Add these to it yourself: ${composeLines(amendment, importPath).join(' ')}`,
  );
}

function appFor(
  tree: Tree,
  options: WeaverGeneratorSchema,
): { name: string; root: string } | undefined {
  if (options.unitTestRunner === 'none') {
    return undefined;
  }
  return resolveApp(tree, options.app);
}

export default weaverGenerator;

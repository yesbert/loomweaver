import { formatFiles, Tree, updateJson } from '@nx/devkit';
import { generate } from '../../lib/generate/generate';
import {
  addI18nAssetsGlob,
  addTailwindSource,
  resolveApp,
  tsconfigPathsFile,
  workspaceScope,
  writeFiles,
} from '../shared';
import { angularWeaver } from '../../recipes/angular-weaver/recipe';
import { nxWeaverFiles, nxWeaverProject } from './nx-files';
import { WeaverGeneratorSchema } from './schema';

export async function weaverGenerator(
  tree: Tree,
  options: WeaverGeneratorSchema,
): Promise<void> {
  const baseTsconfig = tsconfigPathsFile(tree);
  const app = appFor(tree, options);
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

  const source = generate(angularWeaver, {
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
      spec: options.spec,
    },
  });
  writeFiles(tree, project.projectRoot, source, nxWeaverFiles(project));

  updateJson(tree, baseTsconfig, (json) => {
    json.compilerOptions ??= {};
    json.compilerOptions.paths ??= {};
    json.compilerOptions.paths[project.importPath] = [
      `./${project.projectRoot}/src/index.ts`,
    ];
    return json;
  });

  if (app) {
    addI18nAssetsGlob(tree, app, {
      input: `${project.projectRoot}/src/lib/i18n`,
      output: `i18n/${options.id}`,
    });
    addTailwindSource(tree, app, `${project.projectRoot}/src`);
  }

  await formatFiles(tree);
}

function appFor(
  tree: Tree,
  options: WeaverGeneratorSchema,
): string | undefined {
  if (options.unitTestRunner === 'none') {
    return undefined;
  }
  return resolveApp(tree, options.app).name;
}

export default weaverGenerator;

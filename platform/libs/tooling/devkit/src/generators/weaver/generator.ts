import {
  formatFiles,
  GeneratorCallback,
  logger,
  Tree,
  updateJson,
} from '@nx/devkit';
import { generate } from '../../lib/generate/generate';
import { weaverInput } from '../../recipes/angular-weaver/scaffold';
import { applyAmendments } from '../apply-amendments';
import {
  buildableApps,
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

  const input = weaverInput({
    ...options,
    prefix: project.prefix,
    importPath: project.importPath,
  });
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

  const installed = applyAmendments(
    tree,
    weaverAmendments(input, project.projectRoot),
    resolved && { app: resolved, importPath: project.importPath },
  );

  await formatFiles(tree);
  return installed;
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

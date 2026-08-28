import { formatFiles, readJson, Tree, updateJson } from '@nx/devkit';
import { amendments, generate } from '../../lib/generate/generate';
import { addPostcssPlugin, tsconfigPathsFile, writeFiles } from '../shared';
import { angularDistribution } from '../../recipes/angular-distribution/recipe';
import { nxDistribution, nxDistributionFiles } from './nx-files';
import { DistributionGeneratorSchema } from './schema';

export async function distributionGenerator(
  tree: Tree,
  options: DistributionGeneratorSchema,
): Promise<void> {
  const distribution = nxDistribution({
    name: options.name,
    directory: options.directory,
    tags: options.tags?.split(',').map((tag) => tag.trim()),
    prefix: options.prefix,
    baseTsconfig: tsconfigPathsFile(tree),
    withTests: options.unitTestRunner !== 'none',
  });
  const projectFile = `${distribution.projectRoot}/project.json`;
  const composingIntoExisting = tree.exists(projectFile);
  if (composingIntoExisting) {
    if (!options.force) {
      throw new Error(
        `A project already exists at ${distribution.projectRoot}. Pass --force to compose the ` +
          'distribution into it, replacing the bootstrap files this scaffold owns.',
      );
    }
    const occupantName: unknown = readJson(tree, projectFile).name;
    if (typeof occupantName === 'string' && occupantName !== options.name) {
      throw new Error(
        `The project at ${distribution.projectRoot} is named "${occupantName}", not "${options.name}". ` +
          'Renaming it here would break every reference to it in the workspace — pass ' +
          `--name ${occupantName}.`,
      );
    }
  }

  const source = generate(angularDistribution, {
    name: options.name,
    title: options.title,
    directory: distribution.projectRoot,
    withTests: distribution.withTests,
    styles: options.styles,
  });
  for (const amendment of amendments(angularDistribution, {
    name: options.name,
    styles: options.styles,
  })) {
    if (amendment.kind === 'postcss') {
      addPostcssPlugin(tree, amendment);
    }
  }

  const scaffold = nxDistributionFiles(distribution);
  if (composingIntoExisting) {
    const { 'project.json': ours, ...rest } = scaffold;
    writeFiles(tree, distribution.projectRoot, source, rest);
    mergeProjectJson(tree, projectFile, JSON.parse(ours));
  } else {
    writeFiles(tree, distribution.projectRoot, source, scaffold);
  }

  await formatFiles(tree);
}

interface ProjectJson {
  [key: string]: unknown;
  tags?: readonly unknown[];
  targets?: Record<string, unknown>;
}

function mergeProjectJson(
  tree: Tree,
  projectFile: string,
  ours: ProjectJson,
): void {
  updateJson(tree, projectFile, (existing: ProjectJson) => ({
    ...existing,
    ...ours,
    tags: ours.tags?.length ? ours.tags : (existing.tags ?? []),
    targets: { ...existing.targets, ...ours.targets },
  }));
}

export default distributionGenerator;

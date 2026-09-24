import { formatFiles, logger, readJson, Tree, writeJson } from '@nx/devkit';
import { amendments, generate } from '../../lib/generate/generate';
import { asObject, ensureBuildTarget, JsonObject } from '../../lib/amend/merge';
import { Amendment, BuildTargetAmendment } from '../../lib/amend/types';
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
  const recipeAmendments = amendments(angularDistribution, {
    name: options.name,
    styles: options.styles,
  });
  for (const amendment of recipeAmendments) {
    if (amendment.kind === 'postcss') {
      addPostcssPlugin(tree, amendment);
    }
  }

  const scaffold = nxDistributionFiles(distribution);
  if (composingIntoExisting) {
    const { 'project.json': ours, ...rest } = scaffold;
    writeFiles(tree, distribution.projectRoot, source, rest);
    const project = composedProject(
      readJson(tree, projectFile),
      JSON.parse(ours),
      {
        amendments: recipeAmendments.filter(isBuildTarget),
        projectRoot: distribution.projectRoot,
      },
    );
    writeJson(tree, projectFile, project.value);
    for (const setting of project.declined) {
      logger.warn(
        `${projectFile} keeps a value of its own where the workbench needs another, so this was not added: ${setting}`,
      );
    }
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

interface WorkbenchBuildNeeds {
  readonly amendments: readonly BuildTargetAmendment[];
  readonly projectRoot: string;
}

function composedProject(
  occupant: ProjectJson,
  ours: ProjectJson,
  needs: WorkbenchBuildNeeds,
): { value: ProjectJson; declined: readonly string[] } {
  const merged = occupantFirst(occupant, ours) as ProjectJson;
  let build = merged.targets?.['build'];
  const declined: string[] = [];
  for (const amendment of needs.amendments) {
    const result = ensureBuildTarget(build, amendment, needs.projectRoot);
    build = result.value;
    declined.push(...result.declined);
  }
  return {
    value: {
      ...merged,
      tags: ours.tags?.length ? ours.tags : (occupant.tags ?? []),
      targets: { ...merged.targets, build },
    },
    declined,
  };
}

function occupantFirst(occupant: unknown, ours: unknown): unknown {
  const kept = asObject(occupant);
  const offered = asObject(ours);
  if (kept === undefined || offered === undefined) {
    return occupant === undefined ? ours : occupant;
  }
  const merged: JsonObject = { ...kept };
  for (const [key, value] of Object.entries(offered)) {
    merged[key] = occupantFirst(kept[key], value);
  }
  return merged;
}

function isBuildTarget(
  amendment: Amendment,
): amendment is BuildTargetAmendment {
  return amendment.kind === 'build-target';
}

export default distributionGenerator;

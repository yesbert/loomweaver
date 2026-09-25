import { FileMap } from '../../lib/generate/types';
import { NEUTRAL_PREFIX } from '../../lib/scaffolds/scaffold-values';
import {
  depthFor,
  NxScaffoldDepth,
  SHARED_ANGULAR_COMPILER_OPTIONS,
  SHARED_COMPILER_OPTIONS,
  sharedEslintConfig,
  sharedTsconfigSpec,
} from '../project-config-files';

export interface NxWeaverOptions {
  readonly id: string;
  readonly projectName?: string;
  readonly directory?: string;
  readonly importPath?: string;
  readonly scope?: string;
  readonly tags?: readonly string[];
  readonly prefix?: string;
  readonly buildTarget?: string;
  readonly baseTsconfig?: string;
}

export interface NxWeaverProject {
  readonly id: string;
  readonly projectName: string;
  readonly projectRoot: string;
  readonly importPath: string;
  readonly tags: readonly string[];
  readonly prefix: string;
  readonly buildTarget?: string;
  readonly baseTsconfig: string;
  readonly depth: NxScaffoldDepth;
}

export function nxWeaverProject(options: NxWeaverOptions): NxWeaverProject {
  const projectName = options.projectName ?? `${options.id}-weaver`;
  const projectRoot = options.directory ?? `libs/${projectName}`;
  return {
    id: options.id,
    projectName,
    projectRoot,
    importPath:
      options.importPath ??
      (options.scope ? `${options.scope}/${projectName}` : projectName),
    tags: options.tags ?? [],
    prefix: options.prefix ?? NEUTRAL_PREFIX,
    buildTarget: options.buildTarget,
    baseTsconfig: options.baseTsconfig ?? 'tsconfig.base.json',
    depth: depthFor(projectRoot),
  };
}

function projectJson(project: NxWeaverProject): string {
  return JSON.stringify(
    {
      name: project.projectName,
      $schema: `${project.depth.toRoot}/node_modules/nx/schemas/project-schema.json`,
      sourceRoot: `${project.projectRoot}/src`,
      prefix: project.prefix,
      projectType: 'library',
      tags: project.tags,
      targets: {
        ...(project.buildTarget && {
              test: {
                executor: '@nx/angular:unit-test',
                outputs: ['{workspaceRoot}/coverage/{projectName}'],
                options: { buildTarget: project.buildTarget, watch: false },
              },
            }),
        lint: { executor: '@nx/eslint:lint' },
      },
    },
    null,
    2,
  );
}

function tsconfig(project: NxWeaverProject): string {
  return JSON.stringify(
    {
      extends: `${project.depth.toRoot}/${project.baseTsconfig}`,
      compilerOptions: SHARED_COMPILER_OPTIONS,
      angularCompilerOptions: SHARED_ANGULAR_COMPILER_OPTIONS,
      files: [],
      include: [],
      references: [
        { path: './tsconfig.lib.json' },
        ...(project.buildTarget ? [{ path: './tsconfig.spec.json' }] : []),
      ],
    },
    null,
    2,
  );
}

function tsconfigLibrary(project: NxWeaverProject): string {
  return JSON.stringify(
    {
      extends: './tsconfig.json',
      compilerOptions: {
        outDir: `${project.depth.toRoot}/dist/out-tsc`,
        declaration: true,
        declarationMap: true,
        inlineSources: true,
        types: [],
      },
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
    },
    null,
    2,
  );
}

export function nxWeaverFiles(project: NxWeaverProject): FileMap {
  return {
    'project.json': projectJson(project) + '\n',
    'tsconfig.json': tsconfig(project) + '\n',
    'tsconfig.lib.json': tsconfigLibrary(project) + '\n',
    ...(project.buildTarget && { 'tsconfig.spec.json': sharedTsconfigSpec(project.depth) + '\n' }),
    'eslint.config.mjs': sharedEslintConfig(project.depth, project.prefix),
  };
}

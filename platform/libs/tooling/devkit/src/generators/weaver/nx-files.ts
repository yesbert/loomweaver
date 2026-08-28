import { FileMap } from '../../lib/generate/types';
import {
  depthFor,
  NxScaffoldDepth,
  SHARED_ANGULAR_COMPILER_OPTIONS,
  SHARED_COMPILER_OPTIONS,
  sharedEslintConfig,
  sharedTsconfigSpec,
} from '../nx-scaffold-shared';

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
    prefix: options.prefix ?? 'lw',
    buildTarget: options.buildTarget,
    baseTsconfig: options.baseTsconfig ?? 'tsconfig.base.json',
    depth: depthFor(projectRoot),
  };
}

function projectJson(p: NxWeaverProject): string {
  return JSON.stringify(
    {
      name: p.projectName,
      $schema: `${p.depth.toRoot}/node_modules/nx/schemas/project-schema.json`,
      sourceRoot: `${p.projectRoot}/src`,
      prefix: p.prefix,
      projectType: 'library',
      tags: p.tags,
      targets: {
        ...(p.buildTarget
          ? {
              test: {
                executor: '@nx/angular:unit-test',
                outputs: ['{workspaceRoot}/coverage/{projectName}'],
                options: { buildTarget: p.buildTarget, watch: false },
              },
            }
          : {}),
        lint: { executor: '@nx/eslint:lint' },
      },
    },
    null,
    2,
  );
}

function tsconfig(p: NxWeaverProject): string {
  return JSON.stringify(
    {
      extends: `${p.depth.toRoot}/${p.baseTsconfig}`,
      compilerOptions: SHARED_COMPILER_OPTIONS,
      angularCompilerOptions: SHARED_ANGULAR_COMPILER_OPTIONS,
      files: [],
      include: [],
      references: [
        { path: './tsconfig.lib.json' },
        ...(p.buildTarget ? [{ path: './tsconfig.spec.json' }] : []),
      ],
    },
    null,
    2,
  );
}

function tsconfigLib(p: NxWeaverProject): string {
  return JSON.stringify(
    {
      extends: './tsconfig.json',
      compilerOptions: {
        outDir: `${p.depth.toRoot}/dist/out-tsc`,
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

export function nxWeaverFiles(p: NxWeaverProject): FileMap {
  return {
    'project.json': projectJson(p) + '\n',
    'tsconfig.json': tsconfig(p) + '\n',
    'tsconfig.lib.json': tsconfigLib(p) + '\n',
    ...(p.buildTarget
      ? { 'tsconfig.spec.json': sharedTsconfigSpec(p.depth) + '\n' }
      : {}),
    'eslint.config.mjs': sharedEslintConfig(p.depth, p.prefix),
  };
}

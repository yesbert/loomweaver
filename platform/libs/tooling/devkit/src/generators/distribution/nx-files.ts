import { DISTRIBUTION_INITIAL_BUDGET } from '../../recipes/angular-distribution/amendments';
import { FileMap } from '../../lib/generate/types';
import {
  depthFor,
  NxScaffoldDepth,
  SHARED_ANGULAR_COMPILER_OPTIONS,
  SHARED_COMPILER_OPTIONS,
  sharedEslintConfig,
  sharedTsconfigSpec,
} from '../project-config-files';

export interface NxDistributionOptions {
  readonly name: string;
  readonly directory?: string;
  readonly tags?: readonly string[];
  readonly prefix?: string;
  readonly baseTsconfig?: string;
  readonly withTests?: boolean;
}

export interface NxDistribution {
  readonly name: string;
  readonly projectRoot: string;
  readonly outputPath: string;
  readonly tags: readonly string[];
  readonly prefix: string;
  readonly baseTsconfig: string;
  readonly withTests: boolean;
  readonly depth: NxScaffoldDepth;
}

export function nxDistribution(
  options: NxDistributionOptions,
): NxDistribution {
  const projectRoot = options.directory ?? `apps/${options.name}`;
  return {
    name: options.name,
    projectRoot,
    outputPath: `dist/${projectRoot}`,
    tags: options.tags ?? [],
    prefix: options.prefix ?? 'lw',
    baseTsconfig: options.baseTsconfig ?? 'tsconfig.base.json',
    withTests: options.withTests ?? true,
    depth: depthFor(projectRoot),
  };
}

function projectJson(distribution: NxDistribution): string {
  const root = distribution.projectRoot;
  return JSON.stringify(
    {
      name: distribution.name,
      $schema: `${distribution.depth.toRoot}/node_modules/nx/schemas/project-schema.json`,
      projectType: 'application',
      prefix: distribution.prefix,
      sourceRoot: `${root}/src`,
      tags: distribution.tags,
      targets: {
        build: {
          executor: '@angular/build:application',
          outputs: ['{options.outputPath}'],
          defaultConfiguration: 'production',
          options: {
            outputPath: distribution.outputPath,
            browser: `${root}/src/main.ts`,
            tsConfig: `${root}/tsconfig.app.json`,
            serviceWorker: `${root}/ngsw-config.json`,
            assets: [
              { glob: '**/*', input: `${root}/public` },
              {
                glob: '**/*',
                input: 'node_modules/@loomweaver/shell/i18n',
                output: 'i18n',
              },
              {
                glob: '**/*',
                input: 'node_modules/@loomweaver/frame-kit/dist',
                output: 'frame-kit',
              },
            ],
            styles: [`${root}/src/styles.css`],
          },
          configurations: {
            production: {
              budgets: [
                {
                  type: 'initial',
                  maximumWarning: DISTRIBUTION_INITIAL_BUDGET.warning,
                  maximumError: DISTRIBUTION_INITIAL_BUDGET.error,
                },
                {
                  type: 'anyComponentStyle',
                  maximumWarning: '4kb',
                  maximumError: '8kb',
                },
              ],
              outputHashing: 'all',
              optimization: {
                scripts: true,
                fonts: true,
                styles: { minify: true, inlineCritical: false },
              },
            },
            development: {
              optimization: false,
              extractLicenses: false,
              sourceMap: true,
            },
          },
        },
        serve: {
          continuous: true,
          executor: '@angular/build:dev-server',
          defaultConfiguration: 'development',
          configurations: {
            production: { buildTarget: `${distribution.name}:build:production` },
            development: { buildTarget: `${distribution.name}:build:development` },
          },
        },
        lint: { executor: '@nx/eslint:lint' },
        ...(distribution.withTests && {
              test: {
                executor: '@nx/angular:unit-test',
                outputs: ['{workspaceRoot}/coverage/{projectName}'],
                options: { watch: false },
              },
            }),
        'serve-static': {
          continuous: true,
          executor: '@nx/web:file-server',
          options: {
            buildTarget: `${distribution.name}:build`,
            staticFilePath: `${distribution.outputPath}/browser`,
            spa: true,
          },
        },
      },
    },
    null,
    2,
  );
}

function tsconfig(distribution: NxDistribution): string {
  return JSON.stringify(
    {
      extends: `${distribution.depth.toRoot}/${distribution.baseTsconfig}`,
      compilerOptions: SHARED_COMPILER_OPTIONS,
      angularCompilerOptions: SHARED_ANGULAR_COMPILER_OPTIONS,
      files: [],
      include: [],
      references: [
        { path: './tsconfig.app.json' },
        ...(distribution.withTests ? [{ path: './tsconfig.spec.json' }] : []),
      ],
    },
    null,
    2,
  );
}

function tsconfigApp(distribution: NxDistribution): string {
  return JSON.stringify(
    {
      extends: './tsconfig.json',
      compilerOptions: { outDir: `${distribution.depth.toRoot}/dist/out-tsc`, types: [] },
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
    },
    null,
    2,
  );
}

export function nxDistributionFiles(distribution: NxDistribution): FileMap {
  return {
    'project.json': projectJson(distribution) + '\n',
    'tsconfig.json': tsconfig(distribution) + '\n',
    'tsconfig.app.json': tsconfigApp(distribution) + '\n',
    ...(distribution.withTests && { 'tsconfig.spec.json': sharedTsconfigSpec(distribution.depth) + '\n' }),
    'eslint.config.mjs': sharedEslintConfig(distribution.depth, [distribution.prefix, 'app']),
  };
}

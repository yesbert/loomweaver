import { posix } from 'node:path';
import { joinProjectPath, normalizeProjectRoot } from '../lib/amend/merge';

export interface NxScaffoldDepth {
  readonly toRoot: string;
}

const AT_THE_ROOT = '.';

export function insideWorkspace(directory: string): string {
  const normal = posix.normalize(directory.replaceAll('\\', '/'));
  if (posix.isAbsolute(normal) || normal === '..' || normal.startsWith('../')) {
    throw new Error(
      `${directory} lies outside the workspace, so nothing was written. Pass a directory inside it, relative to the workspace root.`,
    );
  }
  return normal;
}

export function projectRootIn(directory: string): string {
  return normalizeProjectRoot(insideWorkspace(directory));
}

/** The relative path back to the workspace root from a project root such as `libs/a/b`. */
export function depthFor(projectRoot: string): NxScaffoldDepth {
  const segments = projectRoot.split('/').filter(Boolean).length;
  return {
    toRoot: Array.from({ length: segments }, () => '..').join('/') || AT_THE_ROOT,
  };
}

export function extendingBase(
  projectRoot: string,
  baseTsconfig: string,
): { readonly extends?: string } {
  return joinProjectPath(projectRoot, 'tsconfig.json') === baseTsconfig
    ? {}
    : { extends: `${depthFor(projectRoot).toRoot}/${baseTsconfig}` };
}

export const SHARED_COMPILER_OPTIONS = {
  strict: true,
  noImplicitOverride: true,
  noPropertyAccessFromIndexSignature: true,
  noImplicitReturns: true,
  noFallthroughCasesInSwitch: true,
  isolatedModules: true,
  target: 'es2022',
  emitDecoratorMetadata: false,
  module: 'preserve',
} as const;

export const SHARED_ANGULAR_COMPILER_OPTIONS = {
  enableI18nLegacyMessageIdFormat: false,
  strictInjectionParameters: true,
  strictInputAccessModifiers: true,
  strictTemplates: true,
} as const;

/**
 * The spec config for the Vitest-based `@nx/angular:unit-test` executor. `lib` is pinned alongside
 * `target` because es2022 syntax without the matching library types rejects APIs the runtime has.
 */
export function sharedTsconfigSpec(depth: NxScaffoldDepth): string {
  return JSON.stringify(
    {
      extends: './tsconfig.json',
      compilerOptions: {
        outDir: `${depth.toRoot}/dist/out-tsc`,
        lib: ['es2022', 'dom'],
        types: ['vitest/globals'],
      },
      include: ['src/**/*.ts', 'src/**/*.d.ts'],
    },
    null,
    2,
  );
}

/**
 * @param prefix the selector prefix, or several when a project legitimately carries more than one —
 * a distribution keeps Angular's own `app-root` alongside its components' prefix.
 */
export function sharedEslintConfig(
  depth: NxScaffoldDepth,
  prefix: string | readonly string[],
): string {
  const prefixes = typeof prefix === 'string' ? [prefix] : prefix;
  const quoted = prefixes.map((entry) => `'${entry}'`);
  const rendered = quoted.length === 1 ? `${quoted[0]}` : `[${quoted.join(', ')}]`;
  const hasBase = depth.toRoot !== AT_THE_ROOT;
  return `import nx from '@nx/eslint-plugin';
${hasBase ? `import baseConfig from '${depth.toRoot}/eslint.config.mjs';\n` : ''}
export default [
  ...nx.configs['flat/angular'],
  ...nx.configs['flat/angular-template'],${hasBase ? '\n  ...baseConfig,' : ''}
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/component-max-inline-declarations': ['error'],
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: ${rendered}, style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: ${rendered}, style: 'kebab-case' },
      ],
    },
  },
  {
    files: ['**/*.spec.ts'],
    rules: {
      '@angular-eslint/component-max-inline-declarations': 'off',
    },
  },
  {
    files: ['**/*.html'],
    rules: {},
  },
];
`;
}

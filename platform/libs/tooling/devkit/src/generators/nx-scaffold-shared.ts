export interface NxScaffoldDepth {
  readonly toRoot: string;
}

/** The relative path back to the workspace root from a project root such as `libs/a/b`. */
export function depthFor(projectRoot: string): NxScaffoldDepth {
  const segments = projectRoot.split('/').filter(Boolean).length;
  return { toRoot: Array.from({ length: segments }, () => '..').join('/') };
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
  const rendered =
    prefixes.length === 1
      ? `'${prefixes[0]}'`
      : `[${prefixes.map((p) => `'${p}'`).join(', ')}]`;
  return `import nx from '@nx/eslint-plugin';
import baseConfig from '${depth.toRoot}/eslint.config.mjs';

export default [
  ...nx.configs['flat/angular'],
  ...nx.configs['flat/angular-template'],
  ...baseConfig,
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

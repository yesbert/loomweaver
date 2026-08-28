import nx from '@nx/eslint-plugin';
import baseConfig from '../../../eslint.config.mjs';

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
        {
          type: 'attribute',
          prefix: 'lw',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'lw',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    // src/lib/foundation holds what every slice may read and no slice owns: composition-time
    // feature flags, pure helpers over id-bearing lists, and the host-side adapters around contract
    // types. It stays a foundation only while it depends on nothing above it — the moment it reaches
    // into a feature, that feature's readers are coupled to it again, which is the tangle the folder
    // was created to undo.
    files: ['src/lib/foundation/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../*'],
              message:
                'foundation/ may not import from a feature slice. Move the dependency down, or the module does not belong in foundation/.',
            },
          ],
        },
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
    // Override or add rules here
    rules: {},
  },
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          buildTargets: ['package'],
          ignoredDependencies: ['tslib'],
          ignoredFiles: [
            '{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}',
            '{projectRoot}/vite.config.{js,cjs,mjs,ts,cts,mts}',
            '{projectRoot}/src/test-setup.ts',
            '{projectRoot}/**/*.spec.ts',
            // Compiles styles/shell.css at our build time. Its postcss/tailwind/esbuild imports are
            // ours, never the consumer's — they ship a finished stylesheet, not a toolchain.
            '{projectRoot}/build-styles.mjs',
          ],
        },
      ],
    },
    languageOptions: {
      parser: await import('jsonc-eslint-parser'),
    },
  },
];

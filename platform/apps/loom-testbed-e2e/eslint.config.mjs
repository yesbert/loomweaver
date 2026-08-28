import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/*.ts'],
    // Playwright specs read env flags and use bracket access on process.env.
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
];

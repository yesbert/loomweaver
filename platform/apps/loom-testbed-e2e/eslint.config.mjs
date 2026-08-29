import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/*.ts'],
    // Playwright specs read env flags and use bracket access on process.env, and a helper
    // marks the window through a global to tell a reload from a soft navigation.
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      'unicorn/no-global-object-property-assignment': 'off',
    },
  },
];

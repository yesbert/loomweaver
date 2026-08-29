import baseConfig from '../../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['src/main.ts'],
    // The MCP server's entry point is a CLI, which is the exception no-process-exit names:
    // it exits with a status the calling client reads.
    rules: {
      'unicorn/no-process-exit': 'off',
    },
  },
];

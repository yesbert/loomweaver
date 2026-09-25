import { angularConfig } from '../../eslint.config.mjs';

export default [
  // The example plugins' pages are plain documents, not Angular templates.
  { ignores: ['public/**/*.html'] },
  ...angularConfig,
  {
    // The example plugins are classic scripts, served verbatim into sandboxed documents with an
    // opaque origin, where loading a module would need CORS headers from the server. Classic
    // scripts share one global scope: the function wrapper keeps a file's names out of it, and
    // the files of one page hand each other what they share on the global object.
    files: ['public/**/*.js'],
    languageOptions: { sourceType: 'script' },
    rules: {
      'unicorn/no-global-object-property-assignment': 'off',
      'unicorn/prefer-block-statement-over-iife': 'off',
    },
  },
];

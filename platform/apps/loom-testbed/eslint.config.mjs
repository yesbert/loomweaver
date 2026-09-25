import { angularConfig } from '../../eslint.config.mjs';

export default [
  // Static plugin assets served verbatim (e.g. the sandboxed iframe plugin + its vendored Penpal
  // bundle) are not app source — don't lint them as TypeScript/JS.
  { ignores: ['**/public/**'] },
  ...angularConfig,
];

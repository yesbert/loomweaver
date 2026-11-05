// Stamps the single-source app version into the shell library.
//
// Reads <Version> from the repo-root Directory.Build.props (the one place a
// version is bumped — see scripts/bump-version.sh) and writes it into a generated
// TS module the frontend can import synchronously. Runs as a dependency of the
// production build (nx.json), so a released bundle always mirrors Directory.Build.props.
// The generated file is committed so fresh checkouts and unit tests compile without a
// build step.
//
// Paths are resolved relative to this file, so the script is cwd-independent.
//
// With --check nothing is written: the script fails when the committed file is not what it would
// write. The release asks that of the tagged commit through scripts/verify-version.mjs, because a
// library is packed from the committed file and a file that drifted would ship a version nobody
// tagged.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const propsFile = resolve(here, '../../Directory.Build.props');
const outFile = resolve(here, '../libs/core/shell/src/lib/version/app-version.ts');

const match = readFileSync(propsFile, 'utf8').match(/<Version>\s*([^<\s]+)\s*<\/Version>/);
if (!match) {
  throw new Error(`No <Version> found in ${propsFile}`);
}
const version = match[1];

const contents = `// GENERATED — do not edit by hand.
// Written by tools/stamp-version.mjs from <Version> in Directory.Build.props.
// Single source of truth: Directory.Build.props (bump via scripts/bump-version.sh).
export const APP_VERSION = '${version}';
`;

if (process.argv.includes('--check')) {
  if (readFileSync(outFile, 'utf8') !== contents) {
    console.error(
      `stamp-version: ${outFile} is not what this script writes for <Version>${version}</Version>. ` +
        'Run `node platform/tools/stamp-version.mjs` and commit the result.',
    );
    process.exit(1);
  }
  console.log(`stamp-version: the committed file already says APP_VERSION = ${version}`);
} else {
  writeFileSync(outFile, contents);
  console.log(`stamp-version: APP_VERSION = ${version}`);
}

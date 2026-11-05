#!/usr/bin/env node

// Description: Fail when a version stamped into the source disagrees with the version being
//              released.
//
// scripts/bump-version.sh writes the version into Directory.Build.props, into the manifests, and
// into two constants a package carries inside its code: APP_VERSION, which the shell shows and
// reports, and PLATFORM_VERSION, which the generators write into a consumer's package.json as the
// version of our packages to install. The release stamps the manifests again from the tag, but it
// packs the two constants as they are committed. A tag on a commit where one of them was left
// behind would publish a shell that names another version, or generators that install one.
//
// So both constants have to equal the version, and the committed app-version.ts has to be exactly
// what platform/tools/stamp-version.mjs writes, which is asked of that script itself. Nothing is
// written. .github/workflows/release.yml calls this before anything is built.
//
// Usage: node scripts/verify-version.mjs <version>

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(import.meta.url), '../..');

const STAMPED = [
  { constant: 'APP_VERSION', file: 'platform/libs/core/shell/src/lib/version/app-version.ts' },
  { constant: 'PLATFORM_VERSION', file: 'platform/libs/tooling/devkit/src/recipes/platform-version.ts' },
];

const version = process.argv[2];
if (!version) {
  console.error('Usage: node scripts/verify-version.mjs <version>');
  process.exit(2);
}

const problems = [];
for (const { constant, file } of STAMPED) {
  const stamped = readFileSync(resolve(root, file), 'utf8').match(new RegExp(`${constant} = '([^']+)'`))?.[1];
  if (stamped === undefined) {
    problems.push(`${file} no longer declares ${constant} as a literal.`);
  } else if (stamped === version) {
    console.log(`verify-version: ${constant} is ${version}`);
  } else {
    problems.push(`${constant} in ${file} is ${stamped}, and the version being released is ${version}.`);
  }
}

const restamp = spawnSync(process.execPath, [resolve(root, 'platform/tools/stamp-version.mjs'), '--check'], {
  encoding: 'utf8',
});
if (restamp.status === 0) {
  console.log(`verify-version: ${restamp.stdout.trim()}`);
} else {
  problems.push((restamp.stderr || restamp.error?.message || 'stamp-version.mjs --check failed').trim());
}

if (problems.length > 0) {
  for (const problem of problems) {
    console.error(`verify-version: ${problem}`);
  }
  console.error('Bump with scripts/bump-version.sh so every place carries the version, then re-tag.');
  process.exit(1);
}

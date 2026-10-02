#!/usr/bin/env node
// Fails when a rule exemption in sonar-project.properties names a file that is no longer there.
//
// Each exemption is a decision that one rule does not apply to one file, kept beside its reason.
// It is keyed by a path pattern, and nothing ties the pattern to the file: move or delete the file
// and the exemption matches nothing, silently. The finding it was written for then reappears in
// Sonar as new, and the reason sits in the configuration beside a path nobody reads. That is how
// eight of forty-three open findings came to be, in October 2026.
//
// Run from `platform/`: npm run sonar-exclusions-check

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { filesUnder } from './files-under.mjs';

const platformRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);
const PROPERTIES = path.join(platformRoot, 'sonar-project.properties');
const RESOURCE_KEY = /^sonar\.issue\.ignore\.multicriteria\.([^.]+)\.resourceKey=(.+)$/;

const sources = ['apps', 'libs'].flatMap((root) =>
  filesUnder(path.join(platformRoot, root), {
    keep: () => true,
    skip: ['node_modules', 'dist', '.angular'],
  }).map((file) => path.relative(platformRoot, file).split(path.sep).join('/')),
);

function matcherOf(pattern) {
  const escaped = pattern
    .split('**/')
    .map((part) =>
      part
        .replaceAll(/[.+^${}()|[\]\\]/g, String.raw`\$&`)
        .replaceAll('*', '[^/]*'),
    )
    .join('(?:.*/)?');
  return new RegExp(`^${escaped}$`);
}

const exemptions = readFileSync(PROPERTIES, 'utf8')
  .split('\n')
  .map((line) => RESOURCE_KEY.exec(line.trim()))
  .filter((match) => match !== null)
  .map(([, name, pattern]) => ({ name, pattern }));

if (exemptions.length === 0) {
  console.error(
    'check-sonar-exclusions: read no exemption from sonar-project.properties — the file changed shape.',
  );
  process.exit(1);
}

const stale = exemptions.filter(({ pattern }) => {
  const matches = matcherOf(pattern);
  return sources.every((file) => !matches.test(file));
});

if (stale.length > 0) {
  console.error(
    'check-sonar-exclusions: an exemption names a file that is not there, so it exempts nothing.\n',
  );
  for (const { name, pattern } of stale) {
    console.error(`  ${name}: ${pattern}`);
  }
  console.error(
    '\nCorrect the path where the file moved, or remove the exemption where the file is gone.',
  );
  process.exit(1);
}

console.log(
  `check-sonar-exclusions: ${exemptions.length} exemption(s), each naming a file that exists.`,
);

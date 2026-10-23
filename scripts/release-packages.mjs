#!/usr/bin/env node
// What the release workflow publishes, read from the one table every checker reads too, so a package
// added there is stamped, checked for trust and published without a second list to keep in step.
//
//   node scripts/release-packages.mjs names          one package name per line
//   node scripts/release-packages.mjs roots          the folder each one publishes from, in order
//   node scripts/release-packages.mjs stamp <ver>    writes <ver> into every manifest that publishes,
//                                                    and into each dependency on a package of ours

import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PUBLISHED_PACKAGES } from '../platform/tools/published-packages.mjs';

const platform = resolve(fileURLToPath(import.meta.url), '../../platform');
const OURS = new Set(PUBLISHED_PACKAGES.map((entry) => entry.name));
const DEPENDENCY_FIELDS = ['dependencies', 'peerDependencies', 'optionalDependencies'];

function stamp(version) {
  for (const entry of PUBLISHED_PACKAGES) {
    const file = join(platform, entry.publishRoot, 'package.json');
    const manifest = JSON.parse(readFileSync(file, 'utf8'));
    manifest.version = version;
    for (const field of DEPENDENCY_FIELDS) {
      for (const name of Object.keys(manifest[field] ?? {})) {
        if (OURS.has(name)) {
          manifest[field][name] = version;
        }
      }
    }
    writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);
  }
}

const [command, version] = process.argv.slice(2);
if (command === 'names') {
  console.log(PUBLISHED_PACKAGES.map((entry) => entry.name).join('\n'));
} else if (command === 'roots') {
  console.log(PUBLISHED_PACKAGES.map((entry) => `platform/${entry.publishRoot}`).join('\n'));
} else if (command === 'stamp' && version) {
  stamp(version);
} else {
  console.error('usage: release-packages.mjs names | roots | stamp <version>');
  process.exit(2);
}

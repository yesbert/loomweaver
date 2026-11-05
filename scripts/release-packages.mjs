#!/usr/bin/env node
// What the release workflow publishes, read from the one table every checker reads too, so a package
// added there is stamped, checked for trust and published without a second list to keep in step.
//
//   node scripts/release-packages.mjs names          one package name per line
//   node scripts/release-packages.mjs roots          the folder each one publishes from, in order
//   node scripts/release-packages.mjs stamp <ver>    writes <ver> into every manifest that publishes,
//                                                    and into each dependency on a package of ours
//   node scripts/release-packages.mjs pending <ver>  the folders still to publish at <ver>, in order:
//                                                    every package the registry does not have at
//                                                    exactly that version
//
// `pending` is what lets a release that failed part-way be run again. A version on npm cannot be
// published a second time, so a second run of a plain loop stops at the first package the failed
// run got out and never reaches the ones behind it. The folders go to stdout for the workflow to
// loop over; what is skipped and what is left is named on stderr, which is the job's log. It only
// reads, so it can be tried against any version without publishing anything.

import { spawnSync } from 'node:child_process';
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

// Whether the registry already has exactly this version. `npm view` answers with the version when
// it does, and with E404 when it has no such version or no such package. Anything else, a registry
// that is down or a network that is not there, is no answer at all and is thrown: read as "not
// published" it would send the release on to publish over a version that may well exist.
function isPublished(name, version) {
  const result = spawnSync('npm', ['view', `${name}@${version}`, 'version', '--json'], { encoding: 'utf8' });
  if (result.error) {
    throw new Error(`npm could not be run to ask about ${name}@${version}: ${result.error.message}`);
  }
  const output = result.stdout.trim();
  let answer;
  try {
    answer = output === '' ? undefined : JSON.parse(output);
  } catch {
    throw new Error(`npm view ${name}@${version} answered something that is not JSON:\n${output}`);
  }
  if (result.status === 0 && answer === version) {
    return true;
  }
  // An npm older than the one the release installs answers a missing version with nothing at all.
  if ((result.status === 0 && answer === undefined) || answer?.error?.code === 'E404') {
    return false;
  }
  const reason = answer?.error ? `${answer.error.code}: ${answer.error.summary}` : result.stderr.trim() || output;
  throw new Error(`the registry gave no usable answer about ${name}@${version} (npm exit ${result.status}).\n${reason}`);
}

function pending(version) {
  const roots = [];
  for (const entry of PUBLISHED_PACKAGES) {
    if (isPublished(entry.name, version)) {
      console.error(`skip     ${entry.name}@${version} is already on npm`);
    } else {
      console.error(`publish  ${entry.name}@${version} is not on npm yet`);
      roots.push(`platform/${entry.publishRoot}`);
    }
  }
  return roots;
}

const [command, version] = process.argv.slice(2);
if (command === 'names') {
  console.log(PUBLISHED_PACKAGES.map((entry) => entry.name).join('\n'));
} else if (command === 'roots') {
  console.log(PUBLISHED_PACKAGES.map((entry) => `platform/${entry.publishRoot}`).join('\n'));
} else if (command === 'stamp' && version) {
  stamp(version);
} else if (command === 'pending' && version) {
  try {
    const roots = pending(version);
    if (roots.length > 0) {
      console.log(roots.join('\n'));
    }
  } catch (error) {
    console.error(`release-packages: ${error.message}`);
    process.exit(1);
  }
} else {
  console.error('usage: release-packages.mjs names | roots | stamp <version> | pending <version>');
  process.exit(2);
}

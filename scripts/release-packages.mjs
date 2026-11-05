#!/usr/bin/env node
// What the release workflow publishes, read from the one table every checker reads too, so a package
// added there is stamped, checked for trust and published without a second list to keep in step.
//
//   node scripts/release-packages.mjs names                  one package name per line
//   node scripts/release-packages.mjs stamp <ver>            writes <ver> into every manifest that
//                                                            publishes, and into each dependency on a
//                                                            package of ours
//   node scripts/release-packages.mjs pending <ver> <commit> the folders still to publish at <ver>,
//                                                            in order, when <commit> is being released
//
// `pending` is what lets a release that failed part-way be run again. A version on npm cannot be
// published a second time, so a second run of a plain loop stops at the first package the failed
// run got out and never reaches the ones behind it. The folders go to stdout for the workflow to
// loop over; what is skipped and what is left is named on stderr, which is the job's log. It only
// reads, so it can be tried against any version and any commit without publishing anything.
//
// A package is skipped only when the registry says that version was published from the commit
// being released. npm records the commit a version was published from as its `gitHead`. Between a
// failed run and its second run the tag can have been moved to a fix: skipping by version alone
// would then leave two packages from the old commit beside five from the new one, under one
// version, and none of them can be taken back. So a version that exists from another commit, or
// from a commit the registry does not name, stops the run before anything is published.

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

// What the registry says about one exact version: the commit it was published from, `null` when it
// is there without one, or `undefined` when it is not there. `npm view` answers E404 when it has no
// such version or no such package. Anything else, a registry that is down or a network that is not
// there, is no answer at all and is thrown: read as "not published" it would send the release on to
// publish over a version that may well exist.
function publishedFrom(name, version) {
  const result = spawnSync('npm', ['view', `${name}@${version}`, 'version', 'gitHead', '--json'], {
    encoding: 'utf8',
  });
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
  // Asked for two fields, npm answers with an object when both are there and with the bare version
  // when the package carries no gitHead.
  const found = typeof answer === 'string' ? { version: answer } : answer;
  if (result.status === 0 && found?.version === version) {
    return found.gitHead ?? null;
  }
  // An npm older than the one the release installs answers a missing version with nothing at all.
  if ((result.status === 0 && answer === undefined) || answer?.error?.code === 'E404') {
    return undefined;
  }
  const reason = answer?.error ? `${answer.error.code}: ${answer.error.summary}` : result.stderr.trim() || output;
  throw new Error(`the registry gave no usable answer about ${name}@${version} (npm exit ${result.status}).\n${reason}`);
}

function pending(version, commit) {
  const roots = [];
  const foreign = [];
  for (const entry of PUBLISHED_PACKAGES) {
    const from = publishedFrom(entry.name, version);
    if (from === undefined) {
      console.error(`publish  ${entry.name}@${version} is not on npm yet`);
      roots.push(`platform/${entry.publishRoot}`);
    } else if (from === commit) {
      console.error(`skip     ${entry.name}@${version} is already on npm, published from this commit`);
    } else {
      foreign.push(
        from === null
          ? `${entry.name}@${version} is on npm, and the registry does not say which commit it was published from`
          : `${entry.name}@${version} is on npm, published from commit ${from}`,
      );
    }
  }
  if (foreign.length > 0) {
    throw new Error(
      `this run releases commit ${commit}, and that is not where these came from:\n` +
        foreign.map((line) => `  ${line}`).join('\n') +
        '\nA version on npm can be neither replaced nor withdrawn, so publishing the rest now would put ' +
        `packages from different commits under ${version}. Nothing was published by this step. ` +
        'Bump the version with scripts/bump-version.sh and tag the new commit.',
    );
  }
  return roots;
}

const [command, version, commit] = process.argv.slice(2);
if (command === 'names') {
  console.log(PUBLISHED_PACKAGES.map((entry) => entry.name).join('\n'));
} else if (command === 'stamp' && version) {
  stamp(version);
} else if (command === 'pending' && version && /^[0-9a-f]{40}$/.test(commit ?? '')) {
  try {
    const roots = pending(version, commit);
    if (roots.length > 0) {
      console.log(roots.join('\n'));
    }
  } catch (error) {
    console.error(`release-packages: ${error.message}`);
    process.exit(1);
  }
} else {
  console.error('usage: release-packages.mjs names | stamp <version> | pending <version> <full commit sha>');
  process.exit(2);
}

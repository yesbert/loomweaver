#!/usr/bin/env node
// Fails when an application's initial bundle grows past what the baseline records.
//
// Every application here already carries an Angular budget, and a budget catches a jump and nothing
// else. The four builds sit a quarter-megabyte under their limits, so a release may add 80 kB and
// report success, and the next one may add 80 kB again. Nothing says a word until a limit breaks
// years later, by which time the growth is a hundred small commits nobody can attribute.
//
// The initial bundle is what the browser fetches before it renders anything: the entry script, the
// chunks index.html preloads, and the stylesheets it links. That set is read from the build output
// rather than from the builder's log, because the log is a human-readable table whose shape belongs
// to the builder. It means this check needs the build to have run, the way check-head does in the
// website.
//
// Sizes are decimal kilobytes, a thousand bytes, because that is what the builder prints and the
// two numbers have to be comparable by eye. The sum here is the same number the builder reports as
// `Initial total`, and the two agreed for all four applications when this was written. A divergence
// means index.html is no longer the right place to read the initial set from.
//
// The recorded ceiling is the measurement rounded up to the next 5 kB. Byte-exact would be the
// sharper ratchet and the wrong one: every commit that touches shell code moves the bundle by some
// bytes, so the baseline would need refreshing in almost every pull request, and a file everybody
// edits by rote is a file nobody reads. Five kilobytes is under one per cent of the smallest of the
// four, so a real addition still lands on a higher step.
//
// bundle-size-baseline.json is a ratchet, the pattern structure-baseline.json and
// cycle-baseline.json already use: growing past a ceiling fails, and dropping a whole step below one
// fails too, so the file cannot drift out of truth in either direction. Refresh it with
// `--write-baseline` when the change is a deliberate one.
//
// The applications are named on the command line rather than discovered, because they are built in
// three different CI jobs and no single step sees all four. A named application with no build output
// fails: a guard that quietly measures nothing when a path moves is worse than no guard.

import { readFileSync, existsSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const STEP_KB = 5;
const BYTES_PER_KB = 1000;

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const baselinePath = path.join(repoRoot, 'platform/tools/bundle-size-baseline.json');

const APPS = {
  'loom-shell': 'platform/dist/apps/loom-shell/browser',
  'loom-testbed': 'platform/dist/apps/loom-testbed/browser',
  demo: 'demo/dist/loomweaver-demo/browser',
  'assistant-workbench': 'examples/assistant-workbench/dist/assistant-workbench/browser',
};

const INITIAL = [
  /<script[^>]+src="([^"]+)"[^>]*type="module"/g,
  /<link[^>]+rel="modulepreload"[^>]+href="([^"]+)"/g,
  /<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g,
];

const kb = (bytes) => bytes / BYTES_PER_KB;
const ceiling = (bytes) => Math.ceil(kb(bytes) / STEP_KB) * STEP_KB;
const fail = (...lines) => {
  for (const line of lines) console.error(line);
  process.exit(1);
};

function measure(name) {
  const dir = path.join(repoRoot, APPS[name]);
  const indexPath = path.join(dir, 'index.html');
  if (!existsSync(indexPath)) {
    fail(
      `check-bundle-size: no build output for '${name}' at ${APPS[name]}/index.html.`,
      '  Build the application first, or fix the path in this checker if the output moved.',
    );
  }
  const html = readFileSync(indexPath, 'utf8');
  const assets = new Set();
  for (const pattern of INITIAL) {
    for (const [, href] of html.matchAll(pattern)) assets.add(href);
  }
  if (assets.size === 0) {
    fail(
      `check-bundle-size: read no initial asset from ${APPS[name]}/index.html.`,
      '  The build output changed shape, and this checker would otherwise measure nothing.',
    );
  }
  let bytes = 0;
  for (const asset of assets) {
    const file = path.join(dir, asset);
    if (!existsSync(file)) {
      fail(`check-bundle-size: ${APPS[name]}/index.html names ${asset}, which is not there.`);
    }
    bytes += statSync(file).size;
  }
  return { name, bytes, assets: assets.size };
}

const args = process.argv.slice(2);
const write = args.includes('--write-baseline');
const names = args.filter((arg) => !arg.startsWith('--'));

if (names.length === 0) {
  fail(
    'check-bundle-size: name at least one application to check.',
    `  Known: ${Object.keys(APPS).join(', ')}`,
  );
}

const unknown = names.filter((name) => !(name in APPS));
if (unknown.length > 0) {
  fail(
    `check-bundle-size: unknown application(s) ${unknown.join(', ')}.`,
    `  Known: ${Object.keys(APPS).join(', ')}`,
  );
}

const measured = names.map(measure);
const baseline = existsSync(baselinePath)
  ? JSON.parse(readFileSync(baselinePath, 'utf8'))
  : { apps: {} };

if (write) {
  const apps = { ...baseline.apps };
  for (const { name, bytes } of measured) apps[name] = ceiling(bytes);
  const sorted = Object.fromEntries(
    Object.entries(apps).toSorted(([a], [b]) => a.localeCompare(b)),
  );
  writeFileSync(
    baselinePath,
    `${JSON.stringify(
      {
        _:
          'The initial bundle of each application, in kilobytes of a thousand bytes, rounded up to ' +
          `the next ${STEP_KB} kB. A ratchet: growing past a ceiling fails, and dropping a whole ` +
          'step below one fails as stale. Refresh with `node tools/check-bundle-size.mjs <app…> ' +
          '--write-baseline` when the change is a deliberate one. The demo and the example build ' +
          'against the published packages, so their numbers move when a release lands.',
        apps: sorted,
      },
      null,
      2,
    )}\n`,
  );
  console.log(
    `check-bundle-size: wrote baseline — ${measured
      .map(({ name, bytes }) => `${name} ${kb(bytes).toFixed(1)} kB under ${ceiling(bytes)}`)
      .join(', ')}.`,
  );
  process.exit(0);
}

const orphans = Object.keys(baseline.apps ?? {}).filter((name) => !(name in APPS));
if (orphans.length > 0) {
  fail(
    `check-bundle-size: the baseline records ${orphans.join(', ')}, which this checker does not know.`,
    '  Remove the entry, or add the application to the list in this file.',
  );
}

const problems = [];
for (const { name, bytes } of measured) {
  const recorded = baseline.apps?.[name];
  if (recorded === undefined) {
    problems.push(
      `  ${name}: ${kb(bytes).toFixed(1)} kB, recorded by nothing — add it with --write-baseline.`,
    );
    continue;
  }
  if (kb(bytes) > recorded) {
    problems.push(
      `  ${name}: ${kb(bytes).toFixed(1)} kB, over the recorded ${recorded} kB by ` +
        `${(kb(bytes) - recorded).toFixed(1)} kB.`,
    );
  } else if (ceiling(bytes) < recorded) {
    problems.push(
      `  ${name}: ${kb(bytes).toFixed(1)} kB, a step under the recorded ${recorded} kB — ` +
        `the entry is stale, refresh it to ${ceiling(bytes)}.`,
    );
  }
}

if (problems.length > 0) {
  fail(
    'check-bundle-size:',
    ...problems,
    '',
    'The ceiling is the measurement rounded up to the next 5 kB. Raise one only when the growth is',
    'meant, with `node tools/check-bundle-size.mjs <app…> --write-baseline`.',
  );
}

console.log(
  `check-bundle-size: ${measured
    .map(
      ({ name, bytes, assets }) =>
        `${name} ${kb(bytes).toFixed(1)} kB of ${baseline.apps[name]} (${assets} initial files)`,
    )
    .join(', ')} — all under the recorded ceiling.`,
);

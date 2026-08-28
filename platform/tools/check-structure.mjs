#!/usr/bin/env node
// Fails when a folder holds too many concepts or a source file grows too long.
//
// Two rules already stand in the engineering standards: folders are cut by feature and never by
// technical type, and a source file holds one concept. Neither was measured, so neither held — the
// largest folder reached 31 concepts and the largest file 942 lines without anybody noticing, because
// neither number is visible without reading the tree.
//
// A concept is one .ts file that is not a .spec.ts. Templates and specs do not count: pane-view.html
// and pane-view.spec.ts are the same concept as pane-view.ts, not two more things to understand.
// Counting concepts rather than files also makes the threshold comparable across slices with
// different test density.
//
// The thresholds come from the measured distribution rather than from a rule of thumb. Folder counts
// ran 31, 22, 22, 21, 14, then a gap down to 12 and below; file lengths ran 942, 752, 708, 544, 515,
// 492, 475, 412, 409, 403, then fell away. Twelve and four hundred are where the tails end.
//
// structure-baseline.json is a ratchet, the pattern cycle-baseline.json and comment-residue.json
// already use: a new violation fails, a worse one fails, and an entry that no longer matches what is
// measured fails too, so the file cannot drift out of truth in either direction. Recording an entry
// is not accepting it forever; it is refusing to pretend the number is zero.

import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CONCEPTS_PER_FOLDER = 12;
const LINES_PER_FILE = 400;
const SKIP = new Set(['node_modules', 'dist', 'tmp', '.angular', 'coverage', 'test-output']);

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const roots = ['platform/libs', 'platform/apps'].map((dir) => path.join(repoRoot, dir));
const baselinePath = path.join(repoRoot, 'platform/tools/structure-baseline.json');

const isConcept = (name) => name.endsWith('.ts') && !name.endsWith('.spec.ts');

// wc -l semantics: a trailing newline terminates the last line rather than opening another.
const countLines = (text) => text.split('\n').length - (text.endsWith('\n') ? 1 : 0);

function walk(dir, folders = new Map(), files = new Map()) {
  const entries = readdirSync(dir, { withFileTypes: true });
  let concepts = 0;
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP.has(entry.name)) walk(full, folders, files);
    } else if (isConcept(entry.name)) {
      concepts += 1;
      const lines = countLines(readFileSync(full, 'utf8'));
      if (lines > LINES_PER_FILE) files.set(rel(full), lines);
    }
  }
  if (concepts > CONCEPTS_PER_FOLDER) folders.set(rel(dir), concepts);
  return { folders, files };
}

function rel(target) {
  return path.relative(repoRoot, target).split(path.sep).join('/');
}

const folders = new Map();
const files = new Map();
for (const root of roots) {
  if (!existsSync(root)) {
    console.error(`check-structure: ${rel(root)} does not exist — nothing was measured`);
    process.exit(1);
  }
  walk(root, folders, files);
}

const sortedByCount = (map) =>
  Object.fromEntries([...map].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));

if (process.argv[2] === '--write-baseline') {
  writeFileSync(
    baselinePath,
    `${JSON.stringify(
      {
        _:
          `Folders over ${CONCEPTS_PER_FOLDER} concepts and source files over ${LINES_PER_FILE} lines, ` +
          'where a concept is one non-spec .ts file. A ratchet: these numbers may shrink and may ' +
          'never grow, and an entry that no longer matches what is measured fails as stale. ' +
          'Refresh with `node tools/check-structure.mjs --write-baseline` only when the change is a ' +
          'resolution.',
        folders: sortedByCount(folders),
        files: sortedByCount(files),
      },
      null,
      2,
    )}\n`,
  );
  console.log(
    `wrote baseline: ${folders.size} folder(s) over ${CONCEPTS_PER_FOLDER} concepts, ` +
      `${files.size} file(s) over ${LINES_PER_FILE} lines`,
  );
  process.exit(0);
}

if (!existsSync(baselinePath)) {
  console.error(`missing ${rel(baselinePath)} — run with --write-baseline once`);
  process.exit(1);
}

const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
const failures = [];

function compare(measured, recorded, unit, advice) {
  for (const [entry, count] of measured) {
    const was = recorded[entry];
    if (was === undefined) failures.push(`${entry}: ${count} ${unit} — ${advice}`);
    else if (count > was)
      failures.push(`${entry}: ${count} ${unit}, was ${was} — ${advice}`);
    else if (count < was)
      failures.push(
        `${entry}: down to ${count} ${unit} from ${was} — record the improvement in the baseline`,
      );
  }
  for (const [entry, count] of Object.entries(recorded)) {
    if (!measured.has(entry))
      failures.push(
        `${entry}: no longer over the threshold (baseline says ${count} ${unit}) — ` +
          'remove it from the baseline',
      );
  }
}

compare(
  folders,
  baseline.folders ?? {},
  'concepts',
  `cut it into sub-themes named for what they do, at most ${CONCEPTS_PER_FOLDER} each`,
);
compare(
  files,
  baseline.files ?? {},
  'lines',
  `split it along the themes its exports already form, at most ${LINES_PER_FILE}`,
);

if (failures.length > 0) {
  console.error('check-structure:');
  for (const failure of failures) console.error(`  ${failure}`);
  console.error(
    '\nA folder holds at most 12 concepts and a source file at most 400 lines; a concept is one ' +
      'non-spec .ts file. The baseline is a ratchet: it may shrink and may never grow. Refresh it ' +
      'with `node tools/check-structure.mjs --write-baseline` only when the change is a resolution.',
  );
  process.exit(1);
}

console.log(
  `check-structure: ${folders.size} folder(s) over ${CONCEPTS_PER_FOLDER} concepts, ` +
    `${files.size} file(s) over ${LINES_PER_FILE} lines — matches the baseline`,
);

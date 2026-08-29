#!/usr/bin/env node
// Fails when the shell's imports point in a circle, at either of two scales.
//
// A cycle between FILES is a defect today: it is a latent initialisation-order bug and it makes both
// halves untestable in isolation. The baseline for those is zero.
//
// A cycle between SLICES usually is not one — different files in each slice point in different
// directions, which is perfectly acyclic at file level. It matters because Nx refuses a project
// graph with a cycle in it, so every mutual pair is a reason the shell cannot yet be cut into
// separate libraries. Those are recorded in cycle-baseline.json, a list that may shrink and may
// never grow, and the distance to a library split is its length.
//
// The baseline is the explicit list rather than a count: a count lets one pair be resolved and
// another appear with the total unchanged. It also fails on a listed pair that no longer exists, so
// the list is trimmed as the work proceeds instead of rotting into things that used to be true.

import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);
const shellRoot = path.join(repoRoot, 'platform/libs/core/shell/src');
const libraryRoot = path.join(shellRoot, 'lib');
const baselinePath = path.join(
  repoRoot,
  'platform/tools/cycle-baseline.json',
);

function sources(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist')
        sources(full, out);
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')) {
      out.push(full);
    }
  }
  return out;
}

// A slice is a direct child of lib/, except that regions/* counts one level deeper — regions/pane is
// a slice, regions is not — because that is where the feature actually sits, and elements/* collapses
// upward because the <lw-*> kit is one cross-cutting unit. Files directly in lib/ are the
// composition root.
function sliceOf(file) {
  const parts = path.relative(libraryRoot, file).split(path.sep);
  if (parts.length === 1) return '(root)';
  if (parts[0] === 'regions' && parts.length > 2) return `regions/${parts[1]}`;
  if (parts[0] === 'elements') return 'elements';
  return parts[0];
}

// Two graphs, because the two questions are not the same one.
//
// `values` drops type-only imports. TypeScript erases `import type` entirely, so such an edge cannot
// put two modules in a circular initialisation — and initialisation order is the whole reason a file
// cycle is a defect. Counting them would report cycles that cannot bite, and the first one measured
// here was exactly that: seven files held together by a single `import type { StripTab }`.
//
// `all` keeps them, because a library split is a compile-time boundary as well as a runtime one, and
// Nx refuses a project graph with a cycle whatever erases later.
function graph(files) {
  const known = new Set(files);
  const resolve = (from, spec) => {
    const base = path.normalize(path.join(path.dirname(from), spec));
    for (const candidate of [`${base}.ts`, path.join(base, 'index.ts')]) {
      if (known.has(candidate)) return candidate;
    }
    return null;
  };
  const values = new Map();
  const all = new Map();
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    const valueOut = new Set();
    const allOut = new Set();
    for (const match of text.matchAll(
      /(?:from|import)\s*(?:\(\s*)?['"](\.[^'"]+)['"]/g,
    )) {
      const target = resolve(file, match[1]);
      if (!target || target === file) continue;
      allOut.add(target);
      const statement = text.lastIndexOf('import', match.index);
      const exported = text.lastIndexOf('export', match.index);
      const start = Math.max(statement, exported);
      if (/^(?:import|export)\s+type\s/.test(text.slice(start, match.index)))
        continue;
      valueOut.add(target);
    }
    values.set(file, [...valueOut]);
    all.set(file, [...allOut]);
  }
  return { values, all };
}

// Tarjan. Iterative rather than recursive: the shell's graph is 209 nodes today, but a checker that
// dies of stack depth on a bad day reports a cycle count of "crash".
function components(edges) {
  const index = new Map();
  const low = new Map();
  const onStack = new Set();
  const stack = [];
  const found = [];
  let counter = 0;

  for (const start of edges.keys()) {
    if (index.has(start)) continue;
    const work = [[start, 0]];
    while (work.length > 0) {
      const frame = work[work.length - 1];
      const [node] = frame;
      if (frame[1] === 0) {
        index.set(node, counter);
        low.set(node, counter);
        counter += 1;
        stack.push(node);
        onStack.add(node);
      }
      const next = (edges.get(node) ?? [])[frame[1]];
      frame[1] += 1;
      if (next !== undefined) {
        if (!index.has(next)) work.push([next, 0]);
        else if (onStack.has(next))
          low.set(node, Math.min(low.get(node), index.get(next)));
        continue;
      }
      work.pop();
      if (work.length > 0) {
        const parent = work[work.length - 1][0];
        low.set(parent, Math.min(low.get(parent), low.get(node)));
      }
      if (low.get(node) === index.get(node)) {
        const group = [];
        let popped;
        do {
          popped = stack.pop();
          onStack.delete(popped);
          group.push(popped);
        } while (popped !== node);
        if (group.length > 1) found.push(group.toSorted((a, b) => a.localeCompare(b)));
      }
    }
  }
  return found;
}

function slicePairs(edges) {
  const between = new Map();
  for (const [file, targets] of edges) {
    const from = sliceOf(file);
    for (const target of targets) {
      const to = sliceOf(target);
      if (to === from) continue;
      between.set(`${from} -> ${to}`, (between.get(`${from} -> ${to}`) ?? 0) + 1);
    }
  }
  const pairs = [];
  for (const key of between.keys()) {
    const [a, b] = key.split(' -> ', 2);
    if (a < b && between.has(`${b} -> ${a}`)) pairs.push(`${a} <-> ${b}`);
  }
  return pairs.toSorted((a, b) => a.localeCompare(b));
}

const rel = (file) => path.relative(libraryRoot, file);

const files = sources(shellRoot);
const { values, all } = graph(files);
const cycles = components(values).toSorted((a, b) => b.length - a.length);
const pairs = slicePairs(all);

if (process.argv[2] === '--write-baseline') {
  writeFileSync(
    baselinePath,
    `${JSON.stringify(
      {
        _: 'Mutually dependent slices in @loomweaver/shell. Not defects: different files in each slice point different ways, which is acyclic at file level. They are the distance to an Nx library split, because Nx refuses a project graph with a cycle in it. This list may shrink and may never grow.',
        fileCycles: cycles.map((group) => group.map(rel)),
        slicePairs: pairs,
      },
      null,
      2,
    )}\n`,
  );
  console.log(
    `wrote baseline: ${cycles.length} file cycle(s), ${pairs.length} slice pair(s)`,
  );
  process.exit(0);
}

if (!existsSync(baselinePath)) {
  console.error(
    `missing ${path.relative(repoRoot, baselinePath)} — run with --write-baseline once`,
  );
  process.exit(1);
}
const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
const failures = [];

const allowedCycles = (baseline.fileCycles ?? []).map((group) =>
  [...group].toSorted((a, b) => a.localeCompare(b)).join('|'),
);
const actualCycles = new Set(cycles.map((group) => group.map(rel).toSorted((a, b) => a.localeCompare(b)).join('|')));

for (const group of cycles) {
  const key = group.map(rel).toSorted((a, b) => a.localeCompare(b)).join('|');
  if (!allowedCycles.includes(key)) {
    failures.push(
      `new import cycle across ${group.length} files:\n      ${group.map(rel).join('\n      ')}`,
    );
  }
}
for (const allowed of allowedCycles) {
  if (!actualCycles.has(allowed)) {
    failures.push(
      `a baselined file cycle is gone — remove it from the baseline:\n      ${allowed.replaceAll('|', '\n      ')}`,
    );
  }
}

const allowedPairs = baseline.slicePairs ?? [];
for (const pair of pairs) {
  if (!allowedPairs.includes(pair)) failures.push(`new mutual slice pair: ${pair}`);
}
for (const pair of allowedPairs) {
  if (!pairs.includes(pair))
    failures.push(`slice pair resolved — remove it from the baseline: ${pair}`);
}

if (failures.length > 0) {
  console.error('check-import-cycles:');
  for (const failure of failures) console.error(`  ${failure}`);
  console.error(
    '\nBoth baselines are ratchets: they may shrink and may never grow. Refresh with ' +
      '`node tools/check-import-cycles.mjs --write-baseline` only when the change is a resolution.',
  );
  process.exit(1);
}

console.log(
  `check-import-cycles: ${files.length} files, ${cycles.length} file cycle(s), ` +
    `${pairs.length} mutual slice pair(s) — matches the baseline`,
);

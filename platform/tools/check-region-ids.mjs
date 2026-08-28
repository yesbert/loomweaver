#!/usr/bin/env node
/**
 * Region ids are strings the shell and the scaffolds have to agree on, and disagreeing costs
 * nothing at build time: a contribution aimed at a region nobody declared renders nothing and says
 * nothing. That is not hypothetical — the scaffolds named the status bar `status` while the shell's
 * own default contribution docked into `status-bar`, so every scaffolded product silently lost its
 * version display, and the quickstart explained the empty bar as normal.
 *
 * This fails the build when a region a shell default targets is missing from the regions the
 * scaffolds emit. It reads sources rather than importing them on purpose: the devkit may only
 * import contracts (`scope:tooling` → `type:contract`), so no single process can hold both sides.
 *
 * The other half of the invariant — that the bare DEFAULT_LAYOUT declares those same regions — is
 * a unit test in layout.spec.ts, where both sides can simply be imported.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const SOURCES = {
  defaults: 'libs/core/shell/src/lib/regions/bar/default-bar-items.ts',
  scaffold: 'libs/tooling/devkit/src/recipes/shell-regions.ts',
};

const read = (path) => readFileSync(join(root, path), 'utf8');
const matchAll = (text, pattern) => [...text.matchAll(pattern)].map((m) => m[1]);

const targeted = new Set(matchAll(read(SOURCES.defaults), /\bbar:\s*'([^']+)'/g));
const scaffolded = new Set(matchAll(read(SOURCES.scaffold), /\bid:\s*'([^']+)'/g));

if (targeted.size === 0 || scaffolded.size === 0) {
  console.error('check-region-ids: read no ids — a source file moved or changed shape.');
  console.error(
    Object.entries(SOURCES)
      .map(([name, path]) => `  ${name}: ${path}`)
      .join('\n'),
  );
  process.exit(1);
}

const missing = [...targeted].filter((id) => !scaffolded.has(id)).sort();

if (missing.length > 0) {
  console.error('check-region-ids: the scaffolds omit a region the shell defaults dock into.\n');
  for (const id of missing) {
    console.error(`  '${id}' — a scaffolded product would silently lose that default.`);
  }
  console.error(`\n  shell defaults target: ${[...targeted].sort().join(', ')}`);
  console.error(`  scaffolds emit:        ${[...scaffolded].sort().join(', ')}`);
  process.exit(1);
}

console.log(
  `check-region-ids: ${targeted.size} region(s) targeted by shell defaults, all emitted by the scaffolds.`,
);

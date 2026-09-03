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
 * The same silence hides the other direction: the weaver recipe docks an instanceable surface into a
 * region by id, and a docked surface renders only in a panel. The recipe once named `primary`,
 * which the scaffolded layout makes a rail, so a scaffolded `--instanceable` weaver showed nothing in
 * a scaffolded product while two tests pinned the id. This fails when a region the weaver recipe
 * docks into is missing from the scaffolded regions or is not a panel there.
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
  weaver: 'libs/tooling/devkit/src/recipes/angular-weaver/recipe.ts',
};

const read = (path) => readFileSync(join(root, path), 'utf8');
const matchAll = (text, pattern) =>
  [...text.matchAll(pattern)].map((m) => m[1]);

const targeted = new Set(
  matchAll(read(SOURCES.defaults), /\bbar:\s*'([^']+)'/g),
);
const scaffoldSource = read(SOURCES.scaffold);
const scaffolded = new Set(matchAll(scaffoldSource, /\bid:\s*'([^']+)'/g));
const regionTypes = new Map(
  [...scaffoldSource.matchAll(/\bid:\s*'([^']+)',\s*type:\s*'([^']+)'/g)].map(
    (m) => [m[1], m[2]],
  ),
);
const docked = new Set(
  matchAll(read(SOURCES.weaver), /\bdocks:\s*\[([^\]]*)\]/g).flatMap((list) =>
    matchAll(list, /'([^']+)'/g),
  ),
);

if (targeted.size === 0 || scaffolded.size === 0) {
  console.error(
    'check-region-ids: read no ids — a source file moved or changed shape.',
  );
  console.error(
    Object.entries(SOURCES)
      .map(([name, path]) => `  ${name}: ${path}`)
      .join('\n'),
  );
  process.exit(1);
}

const missing = [...targeted]
  .filter((id) => !scaffolded.has(id))
  .toSorted((a, b) => a.localeCompare(b));

if (missing.length > 0) {
  console.error(
    'check-region-ids: the scaffolds omit a region the shell defaults dock into.\n',
  );
  for (const id of missing) {
    console.error(
      `  '${id}' — a scaffolded product would silently lose that default.`,
    );
  }
  console.error(
    `\n  shell defaults target: ${[...targeted].toSorted((a, b) => a.localeCompare(b)).join(', ')}`,
  );
  console.error(
    `  scaffolds emit:        ${[...scaffolded].toSorted((a, b) => a.localeCompare(b)).join(', ')}`,
  );
  process.exit(1);
}

const notAPanel = [...docked]
  .filter((id) => regionTypes.get(id) !== 'panel')
  .toSorted((a, b) => a.localeCompare(b));

if (docked.size === 0) {
  console.error(
    `check-region-ids: read no dock target from ${SOURCES.weaver} — the recipe changed shape.`,
  );
  process.exit(1);
}

if (notAPanel.length > 0) {
  console.error(
    'check-region-ids: the weaver recipe docks a surface where no scaffolded panel is.\n',
  );
  for (const id of notAPanel) {
    const type = regionTypes.get(id);
    console.error(
      `  '${id}' — ${type ? `a ${type} in the scaffolded layout` : 'not a region the scaffolds emit'}; a docked surface renders only in a panel.`,
    );
  }
  process.exit(1);
}

console.log(
  `check-region-ids: ${targeted.size} region(s) targeted by shell defaults, all emitted by the scaffolds; ${docked.size} dock target(s) of the weaver recipe, all panels.`,
);

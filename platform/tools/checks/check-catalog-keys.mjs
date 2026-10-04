#!/usr/bin/env node
/**
 * A catalogue field the workbench reads but the catalogue check does not know is reported to every
 * consumer as a misspelling, and a field the check knows but the workbench never reads is accepted
 * while it does nothing. Both happened: `deployed` and `level` were read for months and flagged as
 * typos. The devkit may not import the shell, so this compares the sources.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

const PARSERS = [
  'libs/core/shell/src/lib/plugin-store/catalog/catalog-entry.ts',
  'libs/core/shell/src/lib/plugin-store/lifecycle/installed-plugin.ts',
];
const CHECK = 'libs/tooling/devkit/src/lib/validate/catalog.ts';

const read = (path) => readFileSync(join(root, path), 'utf8');

const parsed = new Set(
  PARSERS.flatMap((path) => [...read(path).matchAll(/\bentry\['([A-Za-z]+)'\]/g)].map((hit) => hit[1])),
);

const list = /CATALOG_ENTRY_KEYS[^=]*=\s*\[([^\]]*)\]/.exec(read(CHECK));
if (!list) {
  console.error(`check-catalog-keys: no CATALOG_ENTRY_KEYS array found in ${CHECK}.`);
  process.exit(1);
}
const known = new Set([...list[1].matchAll(/'([A-Za-z]+)'/g)].map((hit) => hit[1]));

const unchecked = [...parsed].filter((key) => !known.has(key)).toSorted((a, b) => a.localeCompare(b));
const unread = [...known].filter((key) => !parsed.has(key)).toSorted((a, b) => a.localeCompare(b));

if (unchecked.length > 0 || unread.length > 0) {
  console.error('check-catalog-keys: the catalogue check and the workbench disagree on the fields of an entry.');
  if (unchecked.length > 0) {
    console.error(`  read by the workbench, reported as misspelled by the check: ${unchecked.join(', ')}`);
  }
  if (unread.length > 0) {
    console.error(`  accepted by the check, never read by the workbench: ${unread.join(', ')}`);
  }
  process.exit(1);
}
console.log(`check-catalog-keys: ${known.size} catalogue fields, read by the workbench and known to the check alike.`);

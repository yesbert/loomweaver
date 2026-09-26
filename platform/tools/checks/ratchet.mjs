// What every baseline in this folder shares: a ratchet compares what is measured with what is
// recorded and fails in both directions. A new entry or a worse one fails because the number may not
// grow; a better one or a vanished one fails too, so the baseline is written down again and cannot
// drift out of truth.

import { writeFileSync } from 'node:fs';

/**
 * Compares measured counts with recorded ones, each an object of entry to count, and returns the
 * failure lines `describe` words for each case. A describer may return one line or several.
 */
export function compareCounts(measured, recorded, describe) {
  const failures = [];
  for (const [entry, count] of Object.entries(measured)) {
    const was = recorded[entry];
    if (was === undefined) failures.push(describe.added(entry, count));
    else if (count > was) failures.push(describe.grown(entry, count, was));
    else if (count < was) failures.push(describe.shrunk(entry, count, was));
  }
  for (const [entry, was] of Object.entries(recorded)) {
    if (!Object.hasOwn(measured, entry)) failures.push(describe.gone(entry, was));
  }
  return failures.flat();
}

/** Compares a measured list with a recorded one, and returns what is new and what is gone. */
export function compareSets(measured, recorded, describe) {
  const known = new Set(recorded);
  const present = new Set(measured);
  return [
    ...measured.filter((entry) => !known.has(entry)).map((entry) => describe.added(entry)),
    ...recorded.filter((entry) => !present.has(entry)).map((entry) => describe.gone(entry)),
  ].flat();
}

/** Writes a baseline with its explanation first, where a reader of the file meets it. */
export function writeBaseline(file, explanation, body) {
  writeFileSync(file, `${JSON.stringify({ _: explanation, ...body }, null, 2)}\n`);
}

/** Orders an object of entry to count by count, largest first, then by name. */
export function byCount(counts) {
  return Object.fromEntries(
    Object.entries(counts).toSorted((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
  );
}

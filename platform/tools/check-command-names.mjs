#!/usr/bin/env node
// Fails when two commands the shell ships would present the same name to a user, or when one command
// is labelled two different ways.
//
// This exists because that defect is invisible where it lives. The two strings sit in different files
// under different keys, each correct on its own, and nothing reading either one can see the other. It
// reached a consumer as a wrong diagnosis: a report about one reset was reproduced twice against the
// other, because the button they were pointed at and the palette entry they drove said the same words.
//
// Scope is what this repository ships: the shell's own commands, in the languages it ships. A product
// that registers its own commands owns whatever it collides with, which is why this is a check here
// rather than a guard at runtime.

import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const shell = resolve(fileURLToPath(import.meta.url), '../../libs/core/shell/src/lib');
const LANGUAGES = ['en', 'de'];

/** The object literal starting at `from`, as source, with its braces balanced. */
function objectAt(source, from) {
  let depth = 0;
  for (let at = from; at < source.length; at += 1) {
    if (source[at] === '{') {
      depth += 1;
    }
    if (source[at] === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(from, at + 1);
      }
    }
  }
  throw new Error(`unbalanced object literal at ${from}`);
}

/** Brace depth at each character, counting an opening brace as already inside. */
function depths(literal) {
  const at = [];
  let depth = 0;
  for (const character of literal) {
    if (character === '{') {
      depth += 1;
    }
    at.push(depth);
    if (character === '}') {
      depth -= 1;
    }
  }
  return at;
}

/** Raw values of `key` at the top level of an object literal, not inside a nested one. */
function topLevelRaw(literal, key) {
  const pattern = new RegExp(String.raw`${key}:\s*('[^']*'|[A-Za-z_$][\w$.]*)`, 'g');
  const depth = depths(literal);
  const found = [];
  for (const match of literal.matchAll(pattern)) {
    if (depth[match.index] === 1) {
      found.push(match[1]);
    }
  }
  return found;
}

/**
 * The string constants a command may name itself with instead of writing the literal inline. Without
 * these the check would read four of the nine registrations as unnamed and skip them, which is the
 * failure mode it exists to prevent: a guard that quietly covers less than it claims.
 */
function constants() {
  const found = new Map();
  const palette = readFileSync(join(shell, 'commands/command-palette.ts'), 'utf8');
  for (const [, name, value] of palette.matchAll(/export const ([A-Z][A-Z0-9_]*) = '([^']*)'/g)) {
    found.set(name, value);
  }
  const curation = readFileSync(join(shell, 'regions/curation/curation-dialog.ts'), 'utf8');
  for (const [, kind, title] of curation.matchAll(/^\s{2}(\w+): \{ title: '([^']*)'/gm)) {
    found.set(`CURATION_CHROME.${kind}.title`, title);
  }
  return found;
}

/** A literal, or a constant this check knows how to resolve, or nothing. */
function valueOf(raw, known) {
  if (!raw) {
    return null;
  }
  return raw.startsWith("'") ? raw.slice(1, -1) : (known.get(raw) ?? null);
}

/** Every command the shell registers, as id → the translation key it is titled by. */
function commandsFromSeeds(known) {
  const source = readFileSync(join(shell, 'shell-seeds.ts'), 'utf8');
  const commands = new Map();
  const unresolved = [];
  for (const match of source.matchAll(/addCommand\(\s*\{/g)) {
    const literal = objectAt(source, source.indexOf('{', match.index));
    const id = valueOf(topLevelRaw(literal, 'id')[0], known);
    const title = valueOf(topLevelRaw(literal, 'title')[0], known);
    if (id && title) {
      commands.set(id, title);
    } else {
      unresolved.push(literal.slice(0, 80).replaceAll(/\s+/g, ' '));
    }
  }
  return { commands, unresolved };
}

/** Controls in the default settings that run a command, as command id → the key labelling them. */
function labelsFromSettings(known) {
  const source = readFileSync(join(shell, 'default-settings.ts'), 'utf8');
  const labels = [];
  for (const match of source.matchAll(/control:\s*\{/g)) {
    const literal = objectAt(source, source.indexOf('{', match.index));
    const command = valueOf(topLevelRaw(literal, 'command')[0], known);
    const label = valueOf(topLevelRaw(literal, 'label')[0], known);
    if (command && label) {
      labels.push({ command, label });
    }
  }
  return labels;
}

function bundle(language) {
  return JSON.parse(readFileSync(join(shell, 'i18n', `${language}.json`), 'utf8'));
}

function translate(strings, key) {
  let at = strings;
  for (const part of key.split('.')) {
    if (at === null || typeof at !== 'object') {
      return null;
    }
    at = at[part];
  }
  return typeof at === 'string' ? at : null;
}

const known = constants();
const { commands, unresolved } = commandsFromSeeds(known);

if (commands.size === 0) {
  console.error(
    'check-command-names: no commands were found — the parser no longer matches the source',
  );
  process.exit(2);
}

const settingsLabels = labelsFromSettings(known);
const failures = [];

// Skipping quietly is the one outcome this must never have: a check that covers less than it says
// reads as a guarantee and is not one.
for (const where of unresolved) {
  failures.push(
    `a registration names itself with something this check cannot resolve, so it went unchecked — teach it the constant: ${where}`,
  );
}

for (const language of LANGUAGES) {
  const strings = bundle(language);

  // A name may belong to one command. Every place a command is named counts, not only its title:
  // the reported collision was a settings button reading exactly what a different command is called.
  const named = [
    ...[...commands].map(([id, key]) => ({ id, key, where: 'its title' })),
    ...settingsLabels.map(({ command, label }) => ({
      id: command,
      key: label,
      where: 'a settings control',
    })),
  ];
  const byName = new Map();
  for (const { id, key, where } of named) {
    const name = translate(strings, key);
    if (name === null) {
      failures.push(`${language}: ${id} is named by '${key}', which that bundle does not carry`);
      continue;
    }
    const seen = byName.get(name);
    if (!seen) {
      byName.set(name, { id, where });
    } else if (seen.id !== id) {
      failures.push(
        `${language}: "${name}" names ${seen.id} (${seen.where}) and ${id} (${where}) — a user reading it cannot tell which one runs`,
      );
    }
  }

  // One command may not present two names.
  for (const { command, label } of settingsLabels) {
    const key = commands.get(command);
    if (!key) {
      continue;
    }
    const onControl = translate(strings, label);
    const inSearch = translate(strings, key);
    if (onControl !== null && onControl !== inSearch) {
      failures.push(
        `${language}: ${command} is "${inSearch}" where it is searched and "${onControl}" on its own control — one command, two names`,
      );
    }
  }
}

if (failures.length > 0) {
  console.error('check-command-names: the shipped commands do not name themselves apart');
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
}

console.log(
  `check-command-names: ${commands.size} commands, ${LANGUAGES.length} languages, every name its own`,
);

// The licence check the platform, the demo and the website share: one allowlist, one way of reading
// a licence, one way of listing what is installed. Each of the three has its own small checker that
// says which packages it answers for; what "allowed" means is here and nowhere else.
//
// It imports nothing but Node itself, because the demo and the website jobs install their own
// dependencies and not the platform's.
//
// A licence is matched exactly, as the SPDX expression it is. Matching by substring, which
// `license-checker --onlyAllow` does, lets `(MIT AND GPL-3.0-only)` pass because it contains
// "MIT", and the conjunction is the whole point of that expression.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ALLOWED = new Set(
  JSON.parse(readFileSync(new URL('../licence-allowlist.json', import.meta.url), 'utf8')),
);

// expression := conjunction ( OR conjunction )*
// conjunction := unit ( AND unit )*
// unit := "(" expression ")" | licence [ WITH exception ]
//
// Returns whether the expression can be satisfied with allowed licences alone: every part of an
// AND, one part of an OR. Anything that does not parse is not allowed, so free text in a manifest
// fails instead of being guessed at. A licence WITH an exception is its own entry: it passes only
// if the allowlist names it in full.
function satisfiable(tokens, allowed) {
  let at = 0;
  const unit = () => {
    const token = tokens[at++];
    if (token === undefined || token === ')' || token === 'AND' || token === 'OR' || token === 'WITH') {
      throw new SyntaxError('a licence was expected');
    }
    if (token === '(') {
      const inner = expression();
      if (tokens[at++] !== ')') throw new SyntaxError('a closing parenthesis was expected');
      return inner;
    }
    if (tokens[at] !== 'WITH') return allowed.has(token);
    const exception = tokens[at + 1];
    at += 2;
    return exception !== undefined && allowed.has(`${token} WITH ${exception}`);
  };
  const conjunction = () => {
    let all = unit();
    while (tokens[at] === 'AND') {
      at++;
      all = unit() && all;
    }
    return all;
  };
  const expression = () => {
    let any = conjunction();
    while (tokens[at] === 'OR') {
      at++;
      any = conjunction() || any;
    }
    return any;
  };
  const result = expression();
  if (at !== tokens.length) throw new SyntaxError('the expression goes on after its end');
  return result;
}

// What license-checker reports for one package: a string, or a list when the manifest names several
// licences without saying how they combine. A list is read as all of them applying, the reading
// that cannot let one through. A trailing "*" marks a licence inferred from a LICENSE file rather
// than read from the manifest; the licence itself is what matters.
export function licenceIsAllowed(licences, allowed = ALLOWED) {
  const expressions = [licences ?? ''].flat().map((licence) => String(licence).replaceAll('*', ''));
  return expressions.every((expression) => {
    const tokens = expression.match(/[()]|[^\s()]+/g) ?? [];
    try {
      return satisfiable(tokens, allowed);
    } catch {
      return false;
    }
  });
}

// Every package installed under a folder, as license-checker lists it: "name@version" mapped to its
// licences and the folder it sits in. The folder's own package is left out, because it is the
// private project being checked and not something it depends on.
export function installedPackages(directory, { production }) {
  const cwd = path.resolve(directory instanceof URL ? fileURLToPath(directory) : directory);
  const raw = execFileSync(
    'npx',
    ['--yes', 'license-checker', ...(production ? ['--production'] : []), '--json'],
    { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  );
  return Object.entries(JSON.parse(raw))
    .filter(([, info]) => path.resolve(info.path) !== cwd)
    .map(([id, info]) => ({
      id,
      name: id.slice(0, id.lastIndexOf('@')),
      licences: info.licenses,
      folder: path.resolve(info.path),
    }));
}

export function offendersAmong(packages, allowed = ALLOWED) {
  return packages
    .filter((entry) => !licenceIsAllowed(entry.licences, allowed))
    .map((entry) => `${entry.id}: ${[entry.licences].flat().join(', ')}`);
}

// Prints the verdict and ends the process with it. `checked` says what was looked at, so a pass
// names its own scope.
export function conclude(offenders, checked) {
  if (offenders.length > 0) {
    console.error(`\nlicence check failed for ${offenders.length} package(s):`);
    for (const offender of offenders) console.error(`  - ${offender}`);
    console.error('\nAllowed, from licence-allowlist.json: ' + [...ALLOWED].join(', '));
    process.exit(1);
  }
  console.log(`licence check: ${checked} use allowed licences`);
}

#!/usr/bin/env node
// Fails when a published manifest promises a file the tarball does not contain.
//
// A package manifest is a set of promises: `exports`, `main`, `types` and `bin` all name files a
// consumer is entitled to resolve. Nothing verifies them. The gap is real: `styles/shell.css` is
// written by @loomweaver/shell's `styles` target, NOT by `nx package shell`, so packing without that
// target produces a package whose exports map points at a file that was never built — and the
// consumer, not us, is who finds out ("Could not resolve @loomweaver/shell/styles/shell.css").
//
// This reads the PACKED file list (`npm pack --dry-run`), not the working tree, so it also catches
// the second shape of the same bug: a subpath that exists on disk but is excluded from the tarball
// by `files`/`.npmignore`. (Only subpaths — npm always packs `main` and `bin`, whatever `files`
// says, so those two cannot go missing that way.)
//
// Run it after the packaging steps, from `platform/`: npm run package-exports-check

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const platformRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

// The six published packages and the directory each one publishes FROM, mirroring the publish
// pipeline exactly: three are ng-packagr output under dist/, three publish from their source
// directory with a bundled dist inside.
const PACKAGE_ROOTS = [
  'dist/libs/core/plugin-sdk',
  'dist/libs/core/shell',
  'dist/libs/tooling/devkit',
  'dist/libs/integrations/ag-ui',
  'libs/tooling/mcp',
  'libs/tooling/cli',
  'libs/core/frame-kit',
];

// Manifest fields that name a file. `exports` is walked separately because it nests.
const FILE_FIELDS = [
  'main',
  'module',
  'types',
  'typings',
  'browser',
  'style',
  'unpkg',
];

// Boilerplate every tarball carries. A package consisting of nothing else ships no payload, which
// is how a skipped bundle step looks from the outside. @loomweaver/frame-kit used to be invisible to the
// promise check for want of any entry point; it now declares `types` for the description of the
// global its script installs, so its one promise is checked like everybody else's — but it still
// declares no `main`, because it is loaded by reference rather than imported.
const BOILERPLATE =
  /^(package\.json|readme|license|licence|notice|changelog)(\.|$)/i;

/** Collects every path an exports entry can resolve to, across subpaths and condition names. */
function exportPaths(node, out = []) {
  if (typeof node === 'string') {
    out.push(node);
  } else if (Array.isArray(node)) {
    for (const item of node) exportPaths(item, out);
  } else if (node && typeof node === 'object') {
    for (const value of Object.values(node)) exportPaths(value, out);
  }
  return out;
}

/** Every relative path the manifest promises, deduplicated. */
function promisedPaths(manifest) {
  const promised = [];
  for (const field of FILE_FIELDS) {
    if (typeof manifest[field] === 'string') promised.push(manifest[field]);
  }
  if (typeof manifest.bin === 'string') promised.push(manifest.bin);
  else if (manifest.bin && typeof manifest.bin === 'object') {
    promised.push(
      ...Object.values(manifest.bin).filter((v) => typeof v === 'string'),
    );
  }
  if (manifest.exports !== undefined)
    promised.push(...exportPaths(manifest.exports));
  return [...new Set(promised)];
}

/** The tarball's file list, as npm itself computes it (honouring `files` and .npmignore). */
function packedFiles(root) {
  const raw = execFileSync('npm', ['pack', '--dry-run', '--json'], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 32 * 1024 * 1024,
  });
  const [entry] = JSON.parse(raw);
  return new Set(entry.files.map((f) => normalize(f.path)));
}

const normalize = (p) => p.replace(/^\.\//, '').replace(/^\//, '');

/**
 * A promise is kept when the tarball holds the file. Subpath patterns (`./i18n/*`) name a family
 * rather than a file, so they are kept when at least one packed file matches.
 */
function isKept(promise, files) {
  const target = normalize(promise);
  if (!target.includes('*')) return files.has(target);
  const pattern = new RegExp(
    `^${target
      .split('*')
      .map((part) => part.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`))
      .join('.*')}$`,
  );
  return [...files].some((file) => pattern.test(file));
}

const broken = [];
let checked = 0;

for (const relative of PACKAGE_ROOTS) {
  const root = path.join(platformRoot, relative);
  const manifestPath = path.join(root, 'package.json');
  if (!existsSync(manifestPath)) {
    console.error(
      `check-package-exports: ${relative}/package.json is missing — run the packaging steps first ` +
        '(see the packaging step in .github/workflows/release.yml).',
    );
    process.exit(2);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const files = packedFiles(root);
  for (const promise of promisedPaths(manifest)) {
    checked++;
    if (isKept(promise, files)) continue;
    broken.push(
      `${manifest.name} · ${promise}  (declared in ${relative}/package.json)`,
    );
  }
  if ([...files].every((file) => BOILERPLATE.test(file))) {
    broken.push(
      `${manifest.name} · packs no payload, only boilerplate  (from ${relative})`,
    );
  }
}

if (broken.length > 0) {
  console.error(
    `check-package-exports: ${broken.length} manifest promise(s) resolve to nothing in the tarball:\n` +
      broken.map((b) => `  - ${b}`).join('\n') +
      '\n\nEither the file is never built (check that every build step ran — @loomweaver/shell needs ' +
      '`nx run shell:styles` on top of `nx package shell`), or `files`/.npmignore excludes it.',
  );
  process.exit(1);
}

console.log(
  `check-package-exports: ${checked} manifest promises across ${PACKAGE_ROOTS.length} packages, all present in the tarball`,
);

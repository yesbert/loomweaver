#!/usr/bin/env node
/**
 * The product makes three promises to the browser that it never makes to itself, so none of them
 * fails loudly when they are broken:
 *
 *   - a manifest without icons cannot be installed at all — Chrome wants 192px or larger;
 *   - an index that declares no icon falls back to whatever sits at /favicon.ico, which for a
 *     scaffolded app is the framework's own mark;
 *   - a service worker that skips the translations installs an app that opens offline and renders
 *     every label as its raw key, because the shell fetches its UI strings at runtime.
 *
 * All three were true of this demo until they were fixed, and all three come from the scaffold.
 * This reads the BUILT output rather than the sources: the config is a wish, ngsw.json is what
 * ships. Run it after `npm run build`.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'dist', 'loomweaver-demo', 'browser');

const problems = [];
const read = (path) => readFileSync(join(out, path), 'utf8');

let manifest;
let ngsw;
let index;
try {
  manifest = JSON.parse(read('manifest.webmanifest'));
  ngsw = JSON.parse(read('ngsw.json'));
  index = read('index.html');
} catch (error) {
  console.error(`check-pwa: nothing to check — build first. (${error.message})`);
  process.exit(1);
}

const sizes = (manifest.icons ?? []).map((icon) => Number.parseInt(icon.sizes, 10));
if (!sizes.some((size) => size >= 192)) {
  problems.push('the manifest offers no icon of 192px or larger, so the app cannot be installed');
}

if (!index.includes('rel="icon"')) {
  problems.push('index.html declares no icon, so the browser falls back to /favicon.ico');
}

const cached = ngsw.assetGroups.flatMap((group) => group.urls);
const translations = cached.filter((url) => url.startsWith('/i18n/'));
if (translations.length === 0) {
  problems.push(
    'the service worker caches no translations, so an offline app shows raw keys for every label',
  );
}

const offline = ['/payments/view.html', '/frame-kit/lw-frame.css', '/api/open-items.json'];
for (const url of offline) {
  if (!cached.includes(url)) {
    problems.push(`the service worker does not cache ${url}, so the installed app loses the isolated plugin offline`);
  }
}

for (const icon of manifest.icons ?? []) {
  if (!cached.includes(`/${icon.src}`)) {
    problems.push(`the service worker does not cache ${icon.src}, which the manifest points at`);
  }
}

if (problems.length > 0) {
  console.error('check-pwa: the installable app is not whole.\n');
  for (const problem of problems) {
    console.error(`  ${problem}`);
  }
  process.exit(1);
}

console.log(
  `check-pwa: ${manifest.icons.length} icons, ${translations.length} translation bundles cached.`,
);

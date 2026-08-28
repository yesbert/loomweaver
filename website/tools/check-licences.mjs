import { execFileSync } from 'node:child_process';

/**
 * Same permissive set the platform packages are gated against. The site ships
 * client-side JavaScript, so its runtime dependencies deserve the same scrutiny.
 */
const ALLOWED = new Set([
  'MIT',
  'ISC',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  '0BSD',
  'Python-2.0',
  'CC0-1.0',
  'CC-BY-4.0',
  'Unlicense',
  'BlueOak-1.0.0',
]);

/**
 * Copyleft exceptions, each named to one package family rather than allowing the licence
 * across the tree. Both are build-time tooling whose code never reaches `dist/`.
 *
 * - `@img/sharp-libvips-*` — the prebuilt libvips binary (LGPL-3.0-or-later) behind Astro's
 *   optional `sharp` dependency. The site uses the passthrough image service, so it never
 *   even runs. It cannot simply be uninstalled: `omit=optional` also strips Rollup's native
 *   binary and breaks the build.
 * - `lightningcss*` — the CSS transformer (MPL-2.0) that Vite 8 depends on, and therefore
 *   Astro 7. MPL-2.0 is file-level copyleft: it obliges publishing changes to *its* files,
 *   which we make none of, and does not reach the work that uses it. It runs during the
 *   build and emits plain CSS; nothing of it is served.
 */
const EXCLUDED = [/^@img\/sharp-libvips-/, /^lightningcss(-|$)/];

const raw = execFileSync('npx', ['--yes', 'license-checker', '--production', '--json'], {
  encoding: 'utf8',
  maxBuffer: 32 * 1024 * 1024,
});

const offenders = [];
for (const [pkg, info] of Object.entries(JSON.parse(raw))) {
  const name = pkg.slice(0, pkg.lastIndexOf('@'));
  if (EXCLUDED.some((pattern) => pattern.test(name))) continue;

  // license-checker appends "*" when it inferred the licence from a LICENSE file
  // rather than the manifest; the licence itself is what matters.
  const licences = String(info.licenses ?? '')
    .replace(/[*]/g, '')
    .replace(/^\((.*)\)$/, '$1')
    .split(/\s+OR\s+/)
    .map((l) => l.trim());

  if (!licences.some((l) => ALLOWED.has(l))) offenders.push(`${pkg}: ${info.licenses}`);
}

if (offenders.length > 0) {
  console.error(`\nlicence check failed for ${offenders.length} package(s):`);
  for (const o of offenders) console.error(`  - ${o}`);
  process.exit(1);
}

console.log('licence check: all production dependencies use allowed licences');

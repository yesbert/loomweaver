import { conclude, installedPackages, offendersAmong } from '../../scripts/licences.mjs';

/**
 * The site ships client-side JavaScript, so its runtime dependencies are gated against the same
 * allowlist as the platform and the demo, read the same way: `scripts/licences.mjs` at the
 * repository root holds both.
 *
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

const production = installedPackages(new URL('..', import.meta.url), { production: true }).filter(
  (entry) => !EXCLUDED.some((pattern) => pattern.test(entry.name)),
);

conclude(offendersAmong(production), `all ${production.length} production dependencies`);

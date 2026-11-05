// Fails when a production dependency of the demo ships a licence outside the allowlist.
//
// The demo is the one place that may pull in third-party UI libraries, which makes it the one place
// a copyleft dependency can arrive unnoticed. What "allowed" means, and how a licence is read, is
// in scripts/licences.mjs at the repository root, which the platform and the website use too.

import { conclude, installedPackages, offendersAmong } from '../../scripts/licences.mjs';

const production = installedPackages(new URL('..', import.meta.url), { production: true });

conclude(offendersAmong(production), `all ${production.length} production dependencies`);

#!/usr/bin/env node
// Fails when something the platform ships carries a licence outside the allowlist.
//
// Two lists are checked. The production dependencies, which a product installs beside our packages.
// And what the tooling bins inline: the CLI and the MCP server publish as one bundled file with no
// dependencies of their own, so every package esbuild copies into that file ships under our name
// while being a devDependency here, which `--production` never looks at. The bundler says which
// packages those are, from the same build that produces the bin.
//
// What "allowed" means, and how a licence is read, is in scripts/licences.mjs at the repository
// root, which the demo and the website use too.

import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { conclude, installedPackages, offendersAmong } from '../../../scripts/licences.mjs';
import { inlinedPackageFolders } from '../bundle-tooling-bin.mjs';
import { PUBLISHED_PACKAGES } from '../published-packages.mjs';

const platformRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// The tooling packages that publish from their own source folder are the bundled bins.
const BINS = PUBLISHED_PACKAGES.filter((pkg) => pkg.role === 'tooling' && pkg.publishRoot === pkg.source);

const production = installedPackages(platformRoot, { production: true });

const inlinedFolders = new Set();
for (const bin of BINS) {
  const folders = await inlinedPackageFolders(pathToFileURL(path.join(platformRoot, bin.source, 'esbuild.mjs')));
  for (const folder of folders) inlinedFolders.add(folder);
}

const everything = installedPackages(platformRoot, { production: false });
const inlined = everything.filter((entry) => inlinedFolders.has(entry.folder));

// A folder esbuild inlined that the licence listing does not know is a package whose licence nobody
// read. That fails, because passing would mean the check quietly covers less than it says.
const known = new Set(inlined.map((entry) => entry.folder));
const unread = [...inlinedFolders]
  .filter((folder) => !known.has(folder))
  .map((folder) => `${path.relative(platformRoot, folder)}: inlined into a tooling bin, but its licence could not be read`);

const listed = new Set(production.map((entry) => entry.id));
const checked = [...production, ...inlined.filter((entry) => !listed.has(entry.id))];

conclude(
  [...offendersAmong(checked), ...unread],
  `all ${production.length} production dependencies and the ${inlined.length} packages inlined into ` +
    BINS.map((bin) => bin.name).join(' and '),
);

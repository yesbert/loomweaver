#!/usr/bin/env node

// Description: Print the npm dist-tag a version belongs to. A version carrying a prerelease marker
//              is a preview and goes to "next"; anything else goes to "latest".
//
// The tag is derived from the version and never passed alongside it: a preview that reached
// "latest" would be what every plain install resolves to, and a published version cannot be
// withdrawn. For the same reason a marker that is not a valid prerelease fails rather than choosing
// a tag, so an unreadable version stops the release instead of reaching "latest".
// .github/workflows/release.yml calls this.
//
// Usage: node scripts/dist-tag.mjs <version>

import { resolve } from 'node:path';

const PRERELEASE_IDENTIFIER = /^[0-9A-Za-z-]+$/;

export function distTagFor(version) {
  const withoutBuildMetadata = String(version).split('+', 1)[0];
  const marker = withoutBuildMetadata.indexOf('-');
  if (marker === -1) {
    return 'latest';
  }
  const identifiers = withoutBuildMetadata.slice(marker + 1).split('.');
  if (!identifiers.every((identifier) => PRERELEASE_IDENTIFIER.test(identifier))) {
    throw new Error(`${version} carries a prerelease marker that is not a valid one`);
  }
  return 'next';
}

if (process.argv[1] && import.meta.filename === resolve(process.argv[1])) {
  const version = process.argv[2];
  if (!version) {
    console.error('Usage: node scripts/dist-tag.mjs <version>');
    process.exit(1);
  }
  try {
    process.stdout.write(distTagFor(version));
  } catch (error) {
    console.error(`dist-tag: ${error.message}`);
    process.exit(1);
  }
}

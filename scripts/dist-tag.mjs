#!/usr/bin/env node

// Description: Print the npm dist-tag a version belongs to. A version carrying a prerelease marker
//              is a preview and goes to "next"; anything else goes to "latest".
//
// The tag is derived from the version and never passed alongside it: a preview that reached
// "latest" would be what every plain install resolves to, and a published version cannot be
// withdrawn. .github/workflows/release.yml calls this.
//
// Usage: node scripts/dist-tag.mjs <version>

const PRERELEASE_IDENTIFIER = /^[0-9A-Za-z-]+$/;

export function distTagFor(version) {
  const withoutBuildMetadata = String(version).split('+', 1)[0];
  const marker = withoutBuildMetadata.indexOf('-');
  if (marker === -1) {
    return 'latest';
  }
  const identifiers = withoutBuildMetadata.slice(marker + 1).split('.');
  return identifiers.every((identifier) => PRERELEASE_IDENTIFIER.test(identifier))
    ? 'next'
    : 'latest';
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const version = process.argv[2];
  if (!version) {
    console.error('Usage: node scripts/dist-tag.mjs <version>');
    process.exit(1);
  }
  process.stdout.write(distTagFor(version));
}

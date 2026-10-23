#!/usr/bin/env node
// Fails when the version being released is a minor release and docs/updating.md says nothing about
// it.
//
// Before 1.0 a breaking change arrives in a minor release, and a product finds out what that asks of
// it on that page, which the release page also takes its notes from. A minor release without its
// section would ship a break nobody was told how to meet, and the bump is the last moment that can
// still be caught, so the check reads the version the bump writes. A release that asks nothing still
// gets a section, saying so.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { minorReleaseOf, sectionFor, UPDATING_PAGE } from '../../../scripts/update-notes.mjs';

const props = resolve(fileURLToPath(import.meta.url), '../../../../Directory.Build.props');
const version = /<Version>([^<]+)<\/Version>/.exec(readFileSync(props, 'utf8'))?.[1];

if (!version) {
  console.error('check-updating-page: Directory.Build.props carries no <Version>, so nothing was checked');
  process.exit(2);
}

const release = minorReleaseOf(version);
if (!release) {
  console.log(`check-updating-page: ${version} is a patch release, which asks nothing of a product`);
  process.exit(0);
}

if (!sectionFor(readFileSync(UPDATING_PAGE, 'utf8'), release)) {
  console.error(
    `check-updating-page: the version is ${version}, a minor release, and docs/updating.md has no ` +
      `"## ${release}" section with anything in it. A product updating to it would not learn what it ` +
      'asks, and the release page would carry no notes of its own. Add the section: for each change, ' +
      'whom it reaches and what to do, or that it asks nothing.',
  );
  process.exit(1);
}

console.log(`check-updating-page: docs/updating.md says what ${release} asks of a product`);

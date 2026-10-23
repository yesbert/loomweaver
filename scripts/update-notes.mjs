#!/usr/bin/env node

// Description: Print what a release asks of a product, as docs/updating.md states it under the
//              heading of that release, for the release page.
//
// Before 1.0 a minor release is where a breaking change arrives, so every minor release has a
// section there, and a patch release only adds and has none. The section is written once, in the
// guide a product reads, and the release page takes it from there rather than keeping a second copy.
// .github/workflows/release.yml calls this; platform/tools/checks/check-updating-page.mjs makes sure
// the section exists before a minor version is released.
//
// Usage: node scripts/update-notes.mjs <version>

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const UPDATING_PAGE = resolve(fileURLToPath(import.meta.url), '../../docs/updating.md');
const SITE = 'https://loomweaver.dev/';
export const UPDATING_URL = `${SITE}updating/`;

const VERSION = /^(\d+)\.(\d+)\.(\d+)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

/** The release a version belongs to, `0.21.0` for `0.21.0-preview.2`, or nothing for a patch. */
export function minorReleaseOf(version) {
  const match = VERSION.exec(String(version));
  if (!match) {
    throw new Error(`${version} is not a version`);
  }
  const [, major, minor, patch] = match;
  if (patch !== '0' || (major === '0' && minor === '0')) {
    return undefined;
  }
  return `${major}.${minor}.0`;
}

/** The body of the section headed by that release, without its heading, or nothing. */
export function sectionFor(markdown, release) {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `## ${release}`);
  if (start === -1) {
    return undefined;
  }
  const end = lines.findIndex((line, index) => index > start && line.startsWith('## '));
  const body = lines.slice(start + 1, end === -1 ? lines.length : end).join('\n').trim();
  return body === '' ? undefined : body;
}

export function releaseNotes(version, markdown = readFileSync(UPDATING_PAGE, 'utf8')) {
  const release = minorReleaseOf(version);
  const section = release && sectionFor(markdown, release);
  if (!section) {
    return '';
  }
  return [
    `## What ${release} asks of your product`,
    '',
    onTheSite(section),
    '',
    `The whole guide: ${UPDATING_URL}`,
    '',
  ].join('\n');
}

/** A link between two guides, `reference/agent-tools.md#x`, as the page the site serves for it. */
function onTheSite(markdown) {
  return markdown.replaceAll(
    /\]\((?!https?:|#)([^)#\s]+)\.md(#[^)\s]*)?\)/g,
    (_whole, page, anchor = '') => `](${new URL(`${page}/`, SITE).href}${anchor})`,
  );
}

if (process.argv[1] && import.meta.filename === resolve(process.argv[1])) {
  const version = process.argv[2];
  if (!version) {
    console.error('Usage: node scripts/update-notes.mjs <version>');
    process.exit(1);
  }
  try {
    process.stdout.write(releaseNotes(version));
  } catch (error) {
    console.error(`update-notes: ${error.message}`);
    process.exit(1);
  }
}

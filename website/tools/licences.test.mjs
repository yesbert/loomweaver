import assert from 'node:assert/strict';
import { test } from 'node:test';
import { licenceIsAllowed, offendersAmong } from '../../scripts/licences.mjs';

const ALLOWED = new Set(['MIT', 'ISC', 'Apache-2.0']);

test('a licence on the list passes, and one that merely contains a listed name does not', () => {
  assert.equal(licenceIsAllowed('MIT', ALLOWED), true);
  assert.equal(licenceIsAllowed('MIT-0', ALLOWED), false);
  assert.equal(licenceIsAllowed('LGPL-3.0-or-later', ALLOWED), false);
  assert.equal(licenceIsAllowed('Custom: https://example.com/MIT', ALLOWED), false);
});

test('a licence that applies together with a forbidden one fails', () => {
  assert.equal(licenceIsAllowed('(MIT AND GPL-3.0-only)', ALLOWED), false);
  assert.equal(licenceIsAllowed('MIT AND GPL-3.0-only', ALLOWED), false);
  assert.equal(licenceIsAllowed('(MIT AND ISC)', ALLOWED), true);
});

test('a choice passes when one of its alternatives is allowed in full', () => {
  assert.equal(licenceIsAllowed('(MIT OR GPL-3.0-only)', ALLOWED), true);
  assert.equal(licenceIsAllowed('(GPL-2.0-only OR GPL-3.0-only)', ALLOWED), false);
  assert.equal(licenceIsAllowed('GPL-3.0-only OR (MIT AND ISC)', ALLOWED), true);
  assert.equal(licenceIsAllowed('(MIT OR Apache-2.0) AND (GPL-3.0-only OR AGPL-3.0-only)', ALLOWED), false);
  assert.equal(licenceIsAllowed('(MIT OR GPL-3.0-only) AND (ISC OR AGPL-3.0-only)', ALLOWED), true);
});

test('an exception makes a licence its own entry', () => {
  assert.equal(licenceIsAllowed('Apache-2.0 WITH LLVM-exception', ALLOWED), false);
  assert.equal(
    licenceIsAllowed('Apache-2.0 WITH LLVM-exception', new Set(['Apache-2.0 WITH LLVM-exception'])),
    true,
  );
});

test('the mark of a licence inferred from a file is not part of its name', () => {
  assert.equal(licenceIsAllowed('MIT*', ALLOWED), true);
  assert.equal(licenceIsAllowed('GPL-3.0-only*', ALLOWED), false);
});

test('a manifest naming several licences needs every one of them allowed', () => {
  assert.equal(licenceIsAllowed(['MIT', 'ISC'], ALLOWED), true);
  assert.equal(licenceIsAllowed(['MIT', 'GPL-3.0-only'], ALLOWED), false);
});

test('what cannot be read as a licence fails', () => {
  assert.equal(licenceIsAllowed(undefined, ALLOWED), false);
  assert.equal(licenceIsAllowed('', ALLOWED), false);
  assert.equal(licenceIsAllowed('UNLICENSED', ALLOWED), false);
  assert.equal(licenceIsAllowed('(MIT', ALLOWED), false);
  assert.equal(licenceIsAllowed('MIT OR', ALLOWED), false);
  assert.equal(licenceIsAllowed('MIT ISC', ALLOWED), false);
});

test('an offender is named with the licence it carries', () => {
  const packages = [
    { id: 'kept@1.0.0', licences: 'MIT' },
    { id: 'fake@2.0.0', licences: '(MIT AND GPL-3.0-only)' },
  ];
  assert.deepEqual(offendersAmong(packages, ALLOWED), ['fake@2.0.0: (MIT AND GPL-3.0-only)']);
});

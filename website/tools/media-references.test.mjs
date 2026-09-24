import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mediaReferences } from './media-references.mjs';

test('names every picture and poster a page asks the site for, once', () => {
  const html = [
    '<video poster="/media/tour-dark-poster.jpg"></video>',
    '<img src="/media/settings-dark.png" alt="">',
    '<img src="/media/settings-dark.png" alt="">',
    '<img src="/media/settings-light.png" alt="">',
  ].join('\n');

  assert.deepEqual(mediaReferences(html), [
    '/media/tour-dark-poster.jpg',
    '/media/settings-dark.png',
    '/media/settings-light.png',
  ]);
});

test('names the file a docs picture asks for, without its fragment or query', () => {
  const html = '<img src="/media/rail-menu-dark.png#gh-dark-mode-only"><img src="/media/a.png?v=2">';

  assert.deepEqual(mediaReferences(html), ['/media/rail-menu-dark.png', '/media/a.png']);
});

test('leaves out what the site does not serve from its media folder', () => {
  const html = '<img src="/_astro/logo.png"><img src="https://example.com/media/x.png">';

  assert.deepEqual(mediaReferences(html), []);
});

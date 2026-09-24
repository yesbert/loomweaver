import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sidebarLinks } from './sidebar-links.mjs';

const tree = [
  { label: 'Overview', link: '/overview/' },
  {
    label: 'Concepts',
    items: [
      { label: 'Surfaces and panes', link: '/concepts/surfaces-and-panes/' },
      { label: 'Deeper', items: [{ label: 'The address', link: '/concepts/the-address/' }] },
    ],
  },
];

test('holds every link, however deep its group sits', () => {
  assert.deepEqual(
    [...sidebarLinks(tree)],
    ['/overview/', '/concepts/surfaces-and-panes/', '/concepts/the-address/'],
  );
});

test('does not take a route for linked because a longer one starts with it', () => {
  assert.equal(sidebarLinks(tree).has('/concepts/'), false);
});

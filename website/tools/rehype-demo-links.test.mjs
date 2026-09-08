import assert from 'node:assert/strict';
import { test } from 'node:test';
import rehypeDemoLinks from './rehype-demo-links.mjs';

const link = (href, children = [{ type: 'text', value: 'live demo' }]) => ({
  type: 'element',
  tagName: 'a',
  properties: { href },
  children,
});

const run = (...nodes) => {
  const tree = { type: 'root', children: nodes };
  rehypeDemoLinks()(tree);
  return tree.children;
};

test('opens a link to the demo in a new tab and says so', () => {
  const [a] = run(link('https://demo.loomweaver.dev'));

  assert.equal(a.properties.target, '_blank');
  assert.equal(a.properties.rel, 'noopener');
  const note = a.children.at(-1);
  assert.equal(note.tagName, 'span');
  assert.deepEqual(note.properties.className, ['sr-only']);
  assert.equal(note.children[0].value, ' (opens in a new tab)');
});

test('reaches a link nested inside the page', () => {
  const [p] = run({
    type: 'element',
    tagName: 'p',
    properties: {},
    children: [{ type: 'text', value: 'See ' }, link('https://demo.loomweaver.dev/notes')],
  });

  assert.equal(p.children[1].properties.target, '_blank');
});

test('leaves every other link alone', () => {
  const others = run(
    link('https://github.com/yesbert/loomweaver'),
    link('/getting-started/'),
    link('https://docs.ag-ui.com'),
    link('https://demo.loomweaver.dev.example.com/'),
  );

  for (const a of others) {
    assert.equal(a.properties.target, undefined);
    assert.equal(a.children.length, 1);
  }
});

test('does not add the note twice', () => {
  const written = link('https://demo.loomweaver.dev', [
    { type: 'text', value: 'Demo' },
    {
      type: 'element',
      tagName: 'span',
      properties: { className: ['sr-only'] },
      children: [{ type: 'text', value: ' (opens in a new tab)' }],
    },
  ]);

  const [a] = run(written);

  assert.equal(a.properties.target, '_blank');
  assert.equal(a.children.length, 2);
});

test('keeps the query and the fragment a link already carried', () => {
  const [a] = run(link('https://demo.loomweaver.dev/?plugin=notes#top'));

  assert.equal(a.properties.href, 'https://demo.loomweaver.dev/?plugin=notes#top');
  assert.equal(a.properties.target, '_blank');
});

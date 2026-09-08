import assert from 'node:assert/strict';
import { test } from 'node:test';
import { expandCards } from './cards.mjs';

test('turns a marked list into a card grid and asks for MDX', () => {
  const md = [
    'Before.',
    '',
    '<!-- cards -->',
    '',
    '- [Getting started](/getting-started/): a running product in about five minutes.',
    '- [Building with an AI assistant](/building-with-an-assistant/): the same path, typed by an assistant.',
    '',
    'After.',
  ].join('\n');

  const { body, cards } = expandCards(md);

  assert.equal(cards, true);
  assert.match(body, /^import \{ CardGrid, LinkCard \} from '@astrojs\/starlight\/components';$/m);
  assert.match(
    body,
    /<CardGrid>\n {2}<LinkCard title="Getting started" href="\/getting-started\/" description="a running product in about five minutes." \/>/,
  );
  assert.match(body, /<LinkCard title="Building with an AI assistant" href="\/building-with-an-assistant\/"/);
  assert.match(body, /<\/CardGrid>/);
  assert.match(body, /Before\./);
  assert.match(body, /After\./);
  assert.doesNotMatch(body, /<!-- cards -->/);
});

test('leaves a list without the marker alone, and asks for no MDX', () => {
  const md = ['- [Getting started](/getting-started/): untouched.', '- [Samples](/samples/): also untouched.'].join('\n');

  const { body, cards } = expandCards(md);

  assert.equal(cards, false);
  assert.equal(body, md);
  assert.doesNotMatch(body, /LinkCard/);
});

test('a page with no card block is unchanged', () => {
  const md = '# Title\n\nA paragraph, and a `<!-- cards -->` mention inside code.\n';

  const { body, cards } = expandCards(md);

  assert.equal(cards, false);
  assert.equal(body, md);
});

test('an item without a description becomes a card without one', () => {
  const { body } = expandCards('<!-- cards -->\n\n- [Samples](/samples/)\n');

  assert.match(body, /<LinkCard title="Samples" href="\/samples\/" \/>/);
  assert.doesNotMatch(body, /description=/);
});

test('imports once, however many blocks a page carries', () => {
  const md = [
    '<!-- cards -->',
    '',
    '- [One](/one/): first.',
    '',
    'Between.',
    '',
    '<!-- cards -->',
    '',
    '- [Two](/two/): second.',
  ].join('\n');

  const { body, cards } = expandCards(md);

  assert.equal(cards, true);
  assert.equal(body.match(/^import /gm).length, 1);
  assert.equal(body.match(/<CardGrid>/g).length, 2);
});

test('escapes what would otherwise end the attribute', () => {
  const { body } = expandCards('<!-- cards -->\n\n- [Tokens & the "lw" vocabulary](/reference/design-tokens/): a < b.\n');

  assert.match(body, /title="Tokens &amp; the &quot;lw&quot; vocabulary"/);
  assert.match(body, /description="a &lt; b\."/);
});

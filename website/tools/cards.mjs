/* A list of links marked with `<!-- cards -->` is written once, as an ordinary markdown list, and
   rendered on the site as Starlight's own link cards. GitHub renders the marker as nothing and the
   list as a list, which is the correct reading there; the site gets the cards.

   This is the one upgrade that cannot stay markdown. The tab groups are plain HTML because they
   have to be, but a card here is `LinkCard`, so its appearance follows Starlight instead of a
   stylesheet this repository would then maintain. A page that carries a block is therefore written
   as `.mdx`, which is why this returns whether it found one. */

const BLOCK = /(^|\n)[ \t]*<!-- cards -->[ \t]*\n+((?:[ \t]*-[ \t]+\[[^\]\n]+\]\([^)\s]+\)[^\n]*\n?)+)/g;

const ITEM = /^[ \t]*-[ \t]+\[([^\]\n]+)\]\(([^)\s]+)\)(?:[ \t]*:[ \t]*(.*))?$/;

const IMPORT = "import { CardGrid, LinkCard } from '@astrojs/starlight/components';";

function attribute(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function card(line) {
  const match = line.match(ITEM);
  if (!match) return null;
  const [, title, href, description] = match;
  const parts = [`title="${attribute(title.trim())}"`, `href="${attribute(href)}"`];
  if (description?.trim()) parts.push(`description="${attribute(description.trim())}"`);
  return `  <LinkCard ${parts.join(' ')} />`;
}

/**
 * Expand every marked list into a card grid.
 *
 * @param {string} md the page body, after links have been rewritten
 * @returns {{ body: string, cards: boolean }} the body, and whether it now needs MDX
 */
export function expandCards(md) {
  let found = false;
  const body = md.replace(BLOCK, (whole, before, list) => {
    const cards = list.split('\n').map(card).filter(Boolean);
    if (cards.length === 0) return whole;
    /* The import binds a name, so a second block on the same page must not repeat it. */
    const preamble = found ? '' : `${IMPORT}\n\n`;
    found = true;
    return `${before}${preamble}<CardGrid>\n${cards.join('\n')}\n</CardGrid>\n`;
  });
  return { body, cards: found };
}

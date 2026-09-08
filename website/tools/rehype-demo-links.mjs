/* The demo is a running application, not another page of this site. A reader who opens it from the
   middle of a guide has lost their place when they come back, so every link to it opens in a new
   tab. The header button is written that way by hand; a link inside a sentence cannot be, because
   markdown has no syntax for it, so this rewrites them while the page is built.

   It matches the demo's host and nothing else. Making every external link behave this way is a
   different decision, and a bigger one: it would take the choice away from a reader who wanted to
   follow a reference and come back with the back button. */

const DEMO_HOST = 'demo.loomweaver.dev';

const NOTE = ' (opens in a new tab)';

function isDemoLink(node) {
  if (node.type !== 'element' || node.tagName !== 'a') return false;
  const href = node.properties?.href;
  return typeof href === 'string' && /^https?:\/\/demo\.loomweaver\.dev(\/|$|\?|#)/.test(href);
}

function alreadyNoted(node) {
  return node.children.some(
    (child) =>
      child.type === 'element' && [child.properties?.className ?? []].flat().includes('sr-only'),
  );
}

function open(node) {
  node.properties = { ...node.properties, target: '_blank', rel: 'noopener' };
  if (alreadyNoted(node)) return;
  node.children.push({
    type: 'element',
    tagName: 'span',
    properties: { className: ['sr-only'] },
    children: [{ type: 'text', value: NOTE }],
  });
}

function walk(node) {
  if (!node || typeof node !== 'object') return;
  if (isDemoLink(node)) open(node);
  for (const child of node.children ?? []) walk(child);
}

/** Rehype plugin: every link to the demo opens in a new tab, and says so to a screen reader. */
export default function rehypeDemoLinks() {
  return (tree) => {
    walk(tree);
    return tree;
  };
}

export { DEMO_HOST, NOTE };

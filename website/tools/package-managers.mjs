/* A fenced block whose info string is `sh npm` is written once, in the npm spelling, and rendered
   as one tab per package manager: npm, pnpm, yarn and bun. The other three spellings are derived
   by rule, never written, so the markdown on GitHub shows the npm form and the site shows four
   that cannot disagree with it.

   The tab group is plain HTML with radio inputs around ordinary fenced blocks, so the synced pages
   stay markdown: no MDX, no component import, every panel keeps the copy button and the
   highlighting a fenced block gets, and a page without scripting still shows the first tab. */

export const MANAGERS = ['npm', 'pnpm', 'yarn', 'bun'];

const FENCE = /(^|\n)( *)(```|~~~)sh npm[^\n]*\n([\s\S]*?)\n\2\3[^\n]*/g;

export function translateLine(line, manager) {
  if (manager === 'npm') return line;
  const leading = line.match(/^\s*/)[0];
  const body = line.slice(leading.length);
  const exec = { pnpm: 'pnpm dlx', yarn: 'yarn dlx', bun: 'bunx' }[manager];
  const add = { pnpm: 'pnpm add', yarn: 'yarn add', bun: 'bun add' }[manager];
  const dev = { pnpm: '-D', yarn: '-D', bun: '-d' }[manager];
  let out = body;
  if (/^npx\s/.test(body)) {
    out = body.replace(/^npx\s/, `${exec} `);
  } else if (/^npm (install|i|add)\s+-D\s/.test(body)) {
    out = body.replace(/^npm (install|i|add)\s+-D\s/, `${add} ${dev} `);
  } else if (/^npm (install|i|add)\s/.test(body)) {
    out = body.replace(/^npm (install|i|add)\s/, `${add} `);
  } else if (/^npm (run\s+)?(start|test|build)\b/.test(body)) {
    out = body.replace(/^npm (run\s+)?/, `${manager} `);
  }
  return leading + out;
}

export function translate(block, manager) {
  return block
    .split('\n')
    .map((line) => translateLine(line, manager))
    .join('\n');
}

let counter = 0;

/* The container and the tab strip are raw HTML; each panel opens as raw HTML, then leaves a blank
   line, so the fenced block inside it is markdown again and Expressive Code renders it with its
   copy button and highlighting. The closing tags are raw HTML once more. CommonMark ends an HTML
   block at a blank line, which is what makes the mix work, and the browser nests the tags. */
export function renderTabs(block, id = `pm-${++counter}`) {
  const inputs = MANAGERS.map(
    (manager, index) =>
      `<input type="radio" name="${id}" id="${id}-${manager}" class="lw-pm-radio lw-pm-${manager}"${index === 0 ? ' checked' : ''}>`,
  ).join('');
  const labels = MANAGERS.map(
    (manager) => `<label for="${id}-${manager}" class="lw-pm-tab lw-pm-${manager}">${manager}</label>`,
  ).join('');
  const panels = MANAGERS.map(
    (manager) =>
      `<div class="lw-pm-panel lw-pm-${manager}">\n\n\`\`\`sh\n${translate(block, manager)}\n\`\`\`\n\n</div>`,
  ).join('\n');
  return `<div class="lw-pm">${inputs}<div class="lw-pm-tabs" role="tablist">${labels}</div>\n${panels}\n</div>`;
}

export function expandPackageManagerFences(md) {
  return md.replace(FENCE, (whole, before, indent, fence, body) => {
    if (indent) return whole;
    return `${before}${renderTabs(body)}\n`;
  });
}

export function resetTabIds() {
  counter = 0;
}

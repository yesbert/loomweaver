#!/usr/bin/env node
// Fails when a documentation page breaks one of the four style rules that can be measured.
//
// The documentation audit of 2026-09-03 found the same three faults on most pages: sentences that
// carry two or three thoughts, pages that state platform behaviour without saying where the
// guarantee is, and one thing spelled two ways. Each has a rule in CONTRIBUTING.md, *Writing the
// docs*. None of the three was measured, so none held. This measures them:
//
//   1. A sentence over 40 words. Counted outside code blocks, tables and inline code; a link counts
//      by its text. Forty is where the audit's sample stopped being readable in one pass.
//   2. The derived-from-specs header on every page under docs/. The three pages that are maps rather
//      than guides (the index, the glossary, the operations notes) are exempt by name.
//   3. A dash used as a sentence joint. Counted in the same prose, so a dash in a heading, a table
//      cell or code is untouched. This one is absolute rather than a ratchet: the corpus reached
//      zero in one pass, and a rule at zero needs no baseline to argue with.
//   4. A word the glossary does not use: "plug-in" for plugin, "URL pane" for address pane,
//      "activity bar" for rail, and American spellings beside the British ones the pages use. One
//      word, one spelling, so that a search finds every mention. Code and a quoted workbench label
//      (*Customize activity bar*) are exempt: they are what they are.
//
// docs-style-baseline.json is a ratchet, the pattern structure-baseline.json already uses: a page
// with more long sentences than recorded fails, a new page with any fails, and an entry that no
// longer matches what is measured fails too, so the file cannot drift out of truth in either
// direction. A page that got shorter therefore asks for `--write-baseline`, which is the point:
// the number goes down on purpose, never by accident.

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WORDS_PER_SENTENCE = 40;
const HEADER = '<!-- derived-from-specs -->';
const HEADER_EXEMPT = new Set(['docs/README.md', 'docs/glossary.md', 'docs/reference/operations.md']);
// The glossary names the words the pages do not use, so a reader who searches for one lands there.
const VOCABULARY_EXEMPT = new Set(['docs/glossary.md']);
const VARIANTS = [
  [/\bplug-ins?\b/gi, 'plugin'],
  [/\bside bars?\b/gi, 'sidebar'],
  [/\bwork spaces?\b/gi, 'workspace'],
  [/\btool bars?\b/gi, 'toolbar'],
  [/\bsub routes?\b/gi, 'sub-route'],
  [/\bURL[ -]panes?\b/g, 'address pane'],
  [/\bprimary panes?\b/gi, 'address pane'],
  [/\bactivity[ -]bars?\b/gi, 'rail'],
  [/\blauncher[ -]rails?\b/gi, 'rail'],
  [/\bcatalogs?\b/gi, 'catalogue'],
  [/\bcolors?\b/gi, 'colour'],
  [/\blocalized\b/gi, 'localised'],
  [/\blocalization\b/gi, 'localisation'],
  [/\bcenter\b/gi, 'centre'],
  [/\bcustomize\b/gi, 'customise'],
  [/\bbehaviors?\b/gi, 'behaviour'],
];

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const baselinePath = path.join(repoRoot, 'platform/tools/docs-style-baseline.json');

function pages() {
  const found = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.md')) found.push(full);
    }
  };
  walk(path.join(repoRoot, 'docs'));
  found.push(path.join(repoRoot, 'README.md'), path.join(repoRoot, 'CONTRIBUTING.md'));
  return found.map((file) => rel(file)).toSorted((a, b) => a.localeCompare(b));
}

function rel(target) {
  return path.relative(repoRoot, target).split(path.sep).join('/');
}

// Prose only: code blocks, tables and the shared header are not sentences, inline code is one word
// however long, a link is its text, a list item is a paragraph of its own, and a paragraph is one
// line so a sentence can wrap.
function prose(markdown) {
  return markdown
    .replaceAll(/```[\s\S]*?```/g, '')
    .replaceAll(/^\|.*$/gm, '')
    .replaceAll(/^#+ .*$/gm, '')
    .replaceAll(/<!--[\s\S]*?-->/g, '')
    .replaceAll(/<[^<>\n]+>/g, '')
    .replaceAll(/`[^`\n]*`/g, 'code')
    .replaceAll(/^> \*\*This is a guide, not the contract\.\*\*[\s\S]*?explain it here\.$/gm, '')
    .replaceAll(/^> ?/gm, '')
    .replaceAll(/\[([^\][]*)\]\([^)]*\)/g, '$1')
    .replaceAll(/\n(?![\t ]*(?:\n|[-*] |\d+\. ))/g, ' ');
}

function longSentences(text) {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z*"(])|\n+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.split(/\s+/).length > WORDS_PER_SENTENCE);
}

const measured = new Map();
const faults = [];
for (const page of pages()) {
  const markdown = readFileSync(path.join(repoRoot, page), 'utf8');
  if (page.startsWith('docs/') && !HEADER_EXEMPT.has(page) && !markdown.includes(HEADER)) {
    faults.push(`${page}: no derived-from-specs header (every page under docs/ says where its guarantees are)`);
  }
  const text = prose(markdown);
  const vocabulary = text
    .replaceAll(/(?<!\*)\*[^*\n]+\*(?!\*)/g, 'label')
    .replaceAll(/(?<!_)_[^_\n]+_(?!_)/g, 'label');
  for (const [pattern, canonical] of VOCABULARY_EXEMPT.has(page) ? [] : VARIANTS) {
    for (const hit of vocabulary.matchAll(pattern)) {
      faults.push(`${page}: "${hit[0]}" is "${canonical}" in the glossary`);
    }
  }
  for (const hit of text.matchAll(/[—–]/g)) {
    const around = text.slice(Math.max(0, hit.index - 40), hit.index + 40).replaceAll('\n', ' ');
    faults.push(`${page}: a dash joins two clauses, use a full stop, a comma or a colon: …${around}…`);
  }
  const long = longSentences(text);
  if (long.length > 0) measured.set(page, long);
}

const counts = Object.fromEntries(
  [...measured].map(([page, long]) => [page, long.length]).toSorted((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
);

if (process.argv[2] === '--write-baseline') {
  writeFileSync(
    baselinePath,
    `${JSON.stringify(
      {
        _:
          `Sentences over ${WORDS_PER_SENTENCE} words per documentation page, measured by ` +
          'check-docs-style.mjs. A ratchet: a page may only go down, and the check fails on an entry ' +
          'that is no longer true. Rewrite with `npm run docs-style-check -- --write-baseline` after ' +
          'shortening a page.',
        longSentences: counts,
      },
      null,
      2,
    )}\n`,
  );
  console.log(`check-docs-style: baseline written, ${Object.keys(counts).length} pages with long sentences`);
  process.exit(0);
}

const baseline = JSON.parse(readFileSync(baselinePath, 'utf8')).longSentences;
for (const [page, count] of Object.entries(counts)) {
  const recorded = baseline[page];
  if (recorded === undefined) {
    faults.push(`${page}: ${count} sentence(s) over ${WORDS_PER_SENTENCE} words, none recorded`);
  } else if (count > recorded) {
    faults.push(`${page}: ${count} sentence(s) over ${WORDS_PER_SENTENCE} words, ${recorded} recorded`);
  } else if (count < recorded) {
    faults.push(`${page}: ${count} sentence(s) over ${WORDS_PER_SENTENCE} words, ${recorded} recorded — write the baseline so the improvement holds`);
  }
  if (recorded === undefined || count > recorded) {
    for (const sentence of measured.get(page).slice(0, 3)) faults.push(`    ${sentence.slice(0, 160)}…`);
  }
}
for (const page of Object.keys(baseline)) {
  if (!Object.hasOwn(counts, page)) faults.push(`${page}: recorded with long sentences but has none — remove the entry`);
}

if (process.argv[2] === '--list') {
  for (const [page, long] of measured) {
    console.log(`\n${page} (${long.length})`);
    for (const sentence of long) console.log(`  · ${sentence}`);
  }
}

if (faults.length > 0) {
  console.error(`check-docs-style: ${faults.length} finding(s)`);
  for (const fault of faults) console.error(`  ${fault}`);
  process.exit(1);
}

const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
console.log(
  `check-docs-style: ${pages().length} pages, every page under docs/ carries its header, one spelling per term, no dash joining two clauses, ${total} long sentences on ${Object.keys(counts).length} pages, none new`,
);

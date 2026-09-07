/**
 * Contrast ratios the landing page and the site chrome depend on.
 *
 * Two of these were defects: the aside inside a landing-page card read 4.49:1 against its own
 * background in the dark theme, and the secondary buttons drew their border at 1.51:1 against a
 * 3:1 requirement. Both were one token away from correct, which is exactly why they came back
 * unnoticed — a palette change three files away is enough. This is the check that says so.
 *
 * The pairs are written out rather than parsed from the CSS on purpose: what a rule computes to
 * depends on which theme is active and which ancestor set the background, and a checker clever
 * enough to work that out is a checker nobody trusts when it disagrees.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const websiteRoot = path.resolve(fileURLToPath(import.meta.url), '../..');

/** Starlight's own scale, and the accents brand.css overrides it with. */
const DARK = {
  bg: '#17181c',
  card: '#23262f',
  /* --sl-color-bg-nav, which Starlight resolves to gray-6 here and gray-7 in the light theme. */
  nav: '#23262f',
  'gray-1': '#23262f',
  'gray-2': '#c1c3c8',
  'gray-3': '#888c96',
  'gray-4': '#888c96',
  'gray-5': '#353841',
  white: '#ffffff',
  black: '#17181c',
  accent: '#2e96c9',
  'text-accent': '#a9d8ec',
  gold: '#c59a2f',
};

const LIGHT = {
  bg: '#ffffff',
  card: '#f6f7f9',
  nav: '#f6f7f9',
  'gray-1': '#edeef3',
  'gray-2': '#353841',
  'gray-3': '#555962',
  'gray-4': '#888c96',
  'gray-5': '#c1c3c8',
  white: '#17181c',
  black: '#ffffff',
  accent: '#1d7099',
  'text-accent': '#0f4a66',
  gold: '#8a6712',
};

const TEXT = 4.5;
const NON_TEXT = 3;

/** [what it is, foreground token, background token, threshold] */
const PAIRS = [
  ['landing body text', 'gray-2', 'bg', TEXT],
  ['landing body text on a card', 'gray-2', 'card', TEXT],
  ['card aside', 'gray-2', 'card', TEXT],
  ['figure caption', 'gray-3', 'bg', TEXT],
  ['video transcript', 'gray-2', 'bg', TEXT],
  ['transcript summary', 'gray-3', 'bg', TEXT],
  ['eyebrow', 'gold', 'bg', TEXT],
  ['rung number', 'gold', 'bg', TEXT],
  ['footer legal links', 'gray-3', 'bg', TEXT],
  ['header main entry', 'gray-2', 'nav', TEXT],
  ['header main entry, current page', 'text-accent', 'nav', TEXT],
  ['landing quick-nav label', 'white', 'bg', TEXT],
  ['landing quick-nav border', 'gray-4', 'bg', NON_TEXT],
  ['secondary button label', 'white', 'bg', TEXT],
  ['primary button label', 'black', 'text-accent', TEXT],
  ['consent decline label', 'gray-2', 'card', TEXT],
  ['consent accept label', 'black', 'text-accent', TEXT],
  ['secondary button border', 'gray-4', 'bg', NON_TEXT],
  ['secondary button hover border', 'accent', 'bg', NON_TEXT],
  ['checklist tick', 'accent', 'bg', NON_TEXT],
  ['focus ring on the page', 'text-accent', 'bg', NON_TEXT],
  ['focus ring on a card', 'text-accent', 'card', NON_TEXT],
];

function channel(value) {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function ratio(foreground, background) {
  const [high, low] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (high + 0.05) / (low + 0.05);
}

/* The palettes above are a copy of what the stylesheets declare, and a copy is a thing that can go
   stale. This is what notices: every token named here has to still be the value brand.css and
   Starlight ship, or the ratios below are arithmetic about a site that no longer exists. */
function drift() {
  const brand = readFileSync(path.join(websiteRoot, 'src/styles/brand.css'), 'utf8');
  const declared = (theme, token) =>
    new RegExp(`--sl-color-${token}:\\s*(#[0-9a-f]{6})`, 'i').exec(
      theme === 'light' ? brand.slice(brand.indexOf("[data-theme='light']")) : brand,
    )?.[1];

  const problems = [];
  for (const [theme, palette] of [
    ['dark', DARK],
    ['light', LIGHT],
  ]) {
    const accent = declared(theme, 'accent');
    if (accent && accent.toLowerCase() !== palette.accent) {
      problems.push(`${theme}: brand.css declares --sl-color-accent ${accent}, this file says ${palette.accent}`);
    }
    const high = declared(theme, 'accent-high');
    if (high && high.toLowerCase() !== palette['text-accent']) {
      problems.push(
        `${theme}: brand.css declares --sl-color-accent-high ${high}, this file says ${palette['text-accent']} — ` +
          'Starlight resolves --sl-color-text-accent to it',
      );
    }
  }
  return problems;
}

const failures = [...drift()];
const report = [];

for (const [theme, palette] of [
  ['dark', DARK],
  ['light', LIGHT],
]) {
  for (const [what, fg, bg, need] of PAIRS) {
    const value = ratio(palette[fg], palette[bg]);
    const ok = value >= need;
    report.push(`  ${ok ? 'ok  ' : 'FAIL'} ${value.toFixed(2).padStart(5)} (needs ${need})  ${theme}: ${what}`);
    if (!ok) {
      failures.push(`${theme}: ${what} is ${value.toFixed(2)}:1 against a required ${need}:1`);
    }
  }
}

if (process.argv.includes('--verbose')) console.log(report.join('\n'));

if (failures.length > 0) {
  console.error(`\ncheck-contrast failed with ${failures.length} problem(s):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(`check-contrast: ${PAIRS.length * 2} colour pairs meet WCAG AA in both themes`);

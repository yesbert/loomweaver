#!/usr/bin/env node
// Writes the icon catalogue in docs/reference/icons.md from loom-icons.ts, and fails when the page
// on disk no longer matches what the source says. `--write` regenerates it.
//
// The names the workbench ships were documented nowhere: design-tokens.md named eight of them as
// examples and left the rest to whoever thought to open loom-icons.ts. What that costs is not a
// missing page, it is a wrong choice — an author who cannot see the set picks a name that reads
// close enough, or contributes a second glyph for something the workbench already draws, and
// `<lw-icon>` renders nothing at all for a name that does not exist.
//
// A hand-kept list would answer that once and then drift, because adding an icon and remembering a
// table in another directory are two separate acts. So the table is generated and this check is what
// makes the second act unnecessary.

import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import * as prettier from 'prettier';
import * as heroicons from '@ng-icons/heroicons/outline';

const repoRoot = resolve(fileURLToPath(import.meta.url), '../../..');
const SOURCE = 'platform/libs/core/shell/src/lib/elements/icon/loom-icons.ts';
const PAGE = 'docs/reference/icons.md';
const START = '<!-- icons:start -->';
const END = '<!-- icons:end -->';

/** Every `name: glyph` in LOOM_ICONS, with where the glyph came from. */
function readIcons() {
  const file = join(repoRoot, SOURCE);
  const source = ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );

  let literal;
  source.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) return;
    for (const declaration of node.declarationList.declarations) {
      if (declaration.name.getText() !== 'LOOM_ICONS') continue;
      const initializer = ts.isAsExpression(declaration.initializer)
        ? declaration.initializer.expression
        : declaration.initializer;
      if (ts.isObjectLiteralExpression(initializer)) literal = initializer;
    }
  });
  if (!literal) throw new Error(`${SOURCE} no longer declares a LOOM_ICONS object literal`);

  const icons = [];
  const problems = [];
  for (const property of literal.properties) {
    if (!ts.isPropertyAssignment(property)) {
      problems.push(`${property.getText()} is not a plain "name: glyph" assignment`);
      continue;
    }
    const name = ts.isStringLiteral(property.name)
      ? property.name.text
      : property.name.getText();
    const value = property.initializer;

    if (ts.isIdentifier(value)) {
      const svg = heroicons[value.text];
      if (typeof svg !== 'string') {
        problems.push(`${name} points at "${value.text}", which @ng-icons/heroicons/outline does not export`);
        continue;
      }
      icons.push({ name, svg, origin: `\`${value.text}\`` });
      continue;
    }
    if (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)) {
      icons.push({ name, svg: value.text, origin: 'drawn for LoomWeaver' });
      continue;
    }
    problems.push(`${name} is neither a heroicon reference nor an inline SVG literal`);
  }

  if (problems.length > 0) throw new Error(`cannot read ${SOURCE}:\n  - ${problems.join('\n  - ')}`);
  return icons;
}

/** One line of SVG, sized and hidden from assistive technology — the name beside it is the label. */
function glyph(svg) {
  const flat = svg
    .split('\n')
    .map((line) => line.trim())
    .join(' ')
    .trim();
  return flat.replace(
    /^<svg\b([^>]*)>/,
    (_, attributes) =>
      `<svg${attributes.replaceAll(/\s(width|height|aria-hidden)="[^"]*"/g, '')}` +
      ` width="24" height="24" aria-hidden="true">`,
  );
}

function table(icons) {
  const rows = icons.toSorted((a, b) => a.name.localeCompare(b.name, 'en'));
  return [
    START,
    '',
    `The workbench ships ${rows.length} names.`,
    '',
    '| Glyph | Name | Glyph source |',
    '| --- | --- | --- |',
    ...rows.map(({ name, svg, origin }) => `| ${glyph(svg)} | \`${name}\` | ${origin} |`),
    '',
    END,
  ].join('\n');
}

function replaceBlock(page, block) {
  const from = page.indexOf(START);
  const to = page.indexOf(END);
  if (from === -1 || to === -1 || to < from) {
    throw new Error(`${PAGE} has lost its "${START}" / "${END}" markers`);
  }
  return page.slice(0, from) + block + page.slice(to + END.length);
}

const pagePath = join(repoRoot, PAGE);
const page = readFileSync(pagePath, 'utf8');
const icons = readIcons();

// The generated table goes through Prettier before it is compared or written. Markdown under docs/
// is formatted and `docs-format-check` holds it, so a table emitted with single-dash separators
// would fail that check, and formatting it by hand would fail this one. Running the formatter here
// is what keeps the two guards from pulling in opposite directions.
const wanted = await prettier.format(replaceBlock(page, table(icons)), {
  ...(await prettier.resolveConfig(pagePath)),
  filepath: pagePath,
});

if (process.argv.includes('--write')) {
  writeFileSync(pagePath, wanted);
  console.log(`check-icon-docs: wrote ${icons.length} icons into ${PAGE}`);
} else if (page === wanted) {
  console.log(`check-icon-docs: ${icons.length} icons, ${PAGE} agrees with ${SOURCE}`);
} else {
  console.error('check-icon-docs: the icon catalogue no longer matches the icons the shell ships');
  console.error('  - regenerate it with: npm run icon-docs --prefix platform');
  process.exit(1);
}

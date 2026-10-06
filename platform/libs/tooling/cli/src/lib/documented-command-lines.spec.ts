import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parseArgs, rejectUnknownFlags } from './args';
import { acceptedFlags } from './run';

const REPO = join(import.meta.dirname, '../../../../../..');

const SOURCES = [
  'llms-full.txt',
  'llms.txt',
  'skills/loomweaver/SKILL.md',
  'README.md',
  ...markdownUnder('docs'),
  ...readdirSync(join(REPO, 'platform/libs/tooling'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `platform/libs/tooling/${entry.name}/README.md`),
];

function markdownUnder(folder: string): string[] {
  return readdirSync(join(REPO, folder), { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => relative(REPO, join(entry.parentPath, entry.name)));
}

function read(path: string): string {
  try {
    return readFileSync(join(REPO, path), 'utf8');
  } catch {
    return '';
  }
}

function tokens(text: string): string[] {
  const found: string[] = [];
  let current = '';
  let quote = '';
  for (const char of text) {
    if (quote) {
      if (char === quote) {
        quote = '';
      } else {
        current += char;
      }
    } else if (char === "'" || char === '"') {
      quote = char;
    } else if (/\s/.test(char)) {
      if (current) found.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  if (current) found.push(current);
  return found;
}

const INVOCATION =
  /(?:npx @loomweaver\/cli(?:@[\w.-]+)?|`loomweaver)((?:[ \t]+(?:'[^']*'|"[^"]*"|[^\s`|&;#)\\]+))*)/g;

function invocationsIn(source: string, index: number, line: string): [string, string[]][] {
  return [...line.matchAll(INVOCATION)]
    .map((match): [string, string[]] => [
      `${source}:${index + 1}: ${match[0].replace('`', '').trim()}`,
      tokens(match[1]),
    ])
    .filter(([, argv]) => argv.every((token) => !/[<…[]/.test(token)));
}

function documentedLines(): [string, string[]][] {
  return SOURCES.flatMap((source) =>
    read(source)
      .split('\n')
      .flatMap((line, index) => invocationsIn(source, index, line)),
  );
}

const LINES = documentedLines();

describe('every command line the documentation gives for the CLI', () => {
  it('is found in the places an assistant and a reader look', () => {
    expect(LINES.length).toBeGreaterThan(20);
  });

  it.each(LINES)('%s', (_, argv) => {
    const args = parseArgs(argv);
    if (!args.command) {
      expect(Object.keys(args.flags).every((flag) => flag === 'help' || flag === 'version')).toBe(true);
      return;
    }
    const accepted = acceptedFlags(args.command);
    expect(accepted, `"${args.command}" is not a command the CLI has`).toBeDefined();
    expect(() => rejectUnknownFlags(args, accepted ?? [])).not.toThrow();
  });
});

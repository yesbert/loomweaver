import { windowsCommandLine } from './exec';

describe('windowsCommandLine', () => {
  it('leaves a plain word as it is', () => {
    expect(windowsCommandLine(['npm', 'install', '@loomweaver/shell'])).toBe(
      'npm install @loomweaver/shell',
    );
  });

  it('quotes an argument with a space, so it stays one argument', () => {
    expect(
      windowsCommandLine(['npx', 'nx', 'g', '--title', 'Acme Studio']),
    ).toBe('npx nx g --title "Acme Studio"');
  });

  it('quotes the shell’s own operators, so they run nothing', () => {
    expect(windowsCommandLine(['npx', '--title', 'R&D | calc'])).toBe(
      'npx --title "R&D | calc"',
    );
  });

  it('keeps a trailing backslash inside its quotes', () => {
    expect(
      windowsCommandLine(['npx', '--directory', String.raw`apps\my app\\`]),
    ).toBe(String.raw`npx --directory "apps\my app\\\\"`);
  });

  it.each(['say "hi"', '100%', 'two\nlines'])(
    'refuses %j, which the shell would read as its own, and says what to do',
    (argument) => {
      expect(() => windowsCommandLine(['npx', '--title', argument])).toThrow(
        /nothing was run\. Leave/,
      );
    },
  );
});

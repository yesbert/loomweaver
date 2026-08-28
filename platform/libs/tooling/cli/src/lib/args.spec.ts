import { ArgError, boolFlag, parseArgs, requiredFlag, stringFlag } from './args';

describe('parseArgs', () => {
  it('takes the first bare token as the command', () => {
    expect(parseArgs(['weaver', '--id', 'notes']).command).toBe('weaver');
  });

  it('reads --flag value and --flag=value alike', () => {
    const args = parseArgs(['weaver', '--id', 'notes', '--name=My Notes']);
    expect(stringFlag(args, 'id')).toBe('notes');
    expect(stringFlag(args, 'name')).toBe('My Notes');
  });

  it('treats a flag followed by another flag as boolean', () => {
    const args = parseArgs(['weaver', '--command', '--id', 'notes']);
    expect(boolFlag(args, 'command')).toBe(true);
    expect(stringFlag(args, 'id')).toBe('notes');
  });

  it('reads --no-<flag> as false, so --no-spec switches the starter test off', () => {
    expect(boolFlag(parseArgs(['weaver', '--no-spec']), 'spec')).toBe(false);
  });

  it('does not swallow a negative-looking value as a flag', () => {
    const args = parseArgs(['weaver', '--shortcut', 'mod+shift+n']);
    expect(stringFlag(args, 'shortcut')).toBe('mod+shift+n');
  });

  it('rejects a second bare token rather than silently ignoring it', () => {
    expect(() => parseArgs(['weaver', 'extra'])).toThrow(ArgError);
  });

  it('rejects a single-dash option', () => {
    expect(() => parseArgs(['weaver', '-x'])).toThrow(ArgError);
  });

  it('fails when a required flag is missing or valueless', () => {
    expect(() => requiredFlag(parseArgs(['weaver']), 'id')).toThrow(ArgError);
    expect(() => requiredFlag(parseArgs(['weaver', '--id']), 'id')).toThrow(
      ArgError,
    );
  });

  it('fails when a boolean flag is given a value', () => {
    expect(() => boolFlag(parseArgs(['weaver', '--command=yes']), 'command')).toThrow(
      ArgError,
    );
  });
});

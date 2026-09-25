import { CommandArgument } from '@loomweaver/plugin-sdk';
import {
  asCommandArguments,
  argumentProblem,
  isCommandAnswer,
} from './command-arguments';

const DECLARED: readonly CommandArgument[] = [
  { name: 'path', kind: 'text', description: 'Where to go', required: true },
  { name: 'count', kind: 'number', description: 'How many' },
  { name: 'pinned', kind: 'boolean', description: 'Pin it' },
  {
    name: 'mode',
    kind: 'choice',
    choices: ['preview', 'permanent'],
    description: 'How to open it',
  },
  { name: 'tags', kind: 'text', description: 'Labels', list: true },
];

describe('argumentProblem', () => {
  it('accepts a call that matches the declaration', () => {
    expect(
      argumentProblem(DECLARED, {
        path: 'a/b',
        count: 2,
        pinned: true,
        mode: 'preview',
        tags: ['x', 'y'],
      }),
    ).toBeNull();
  });

  it('accepts a command that declares nothing, invoked with nothing', () => {
    expect(argumentProblem(undefined, undefined)).toBeNull();
  });

  it('refuses a missing required argument', () => {
    expect(argumentProblem(DECLARED, { count: 1 })).toContain('"path"');
  });

  it('leaves an optional argument out without complaint', () => {
    expect(argumentProblem(DECLARED, { path: 'a' })).toBeNull();
  });

  it('refuses a value of the wrong kind', () => {
    expect(argumentProblem(DECLARED, { path: 7 })).toContain('a text');
    expect(argumentProblem(DECLARED, { path: 'a', count: 'two' })).toContain(
      'a finite number',
    );
    expect(
      argumentProblem(DECLARED, { path: 'a', count: NaN }),
    ).toContain('a finite number');
  });

  it('refuses a choice outside the declared set', () => {
    expect(argumentProblem(DECLARED, { path: 'a', mode: 'sideways' })).toContain(
      'preview, permanent',
    );
  });

  it('tells a list and a single value apart', () => {
    expect(argumentProblem(DECLARED, { path: 'a', tags: 'x' })).toContain(
      'a list',
    );
    expect(argumentProblem(DECLARED, { path: ['a'] })).toContain('not a list');
  });

  it('refuses an argument the command never declared', () => {
    expect(argumentProblem(DECLARED, { path: 'a', colour: 'red' })).toContain(
      '"colour"',
    );
  });

  it('refuses arguments that are not an object at all', () => {
    expect(argumentProblem(DECLARED, 'path=a')).toContain('an object');
    expect(argumentProblem(DECLARED, null)).toContain('an object');
  });
});

describe('asCommandArguments', () => {
  it('carries single values and lists of them', () => {
    expect(asCommandArguments({ a: 'x', b: 2, c: false, d: [1, 2] })).toEqual({
      a: 'x',
      b: 2,
      c: false,
      d: [1, 2],
    });
  });

  it('refuses anything that would not arrive as the value it was', () => {
    expect(asCommandArguments({ when: new Date(0) })).toBeNull();
    expect(asCommandArguments({ nested: { a: 1 } })).toBeNull();
    expect(asCommandArguments({ mixed: ['a', { b: 1 }] })).toBeNull();
    expect(asCommandArguments('not an object')).toBeNull();
  });
});

describe('isCommandAnswer', () => {
  it('accepts plain data', () => {
    expect(isCommandAnswer({ ok: true, rows: [1, 'two', null] })).toBe(true);
    expect(isCommandAnswer('answer')).toBe(true);
  });

  it('refuses what could not be carried unchanged', () => {
    expect(isCommandAnswer(() => undefined)).toBe(false);
    expect(isCommandAnswer(new Date(0))).toBe(false);
    expect(isCommandAnswer({ deep: { a: { b: { c: {} } } } })).toBe(true);
  });
});

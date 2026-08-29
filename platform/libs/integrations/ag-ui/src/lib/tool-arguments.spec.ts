import { readArguments } from './tool-arguments';

describe('readArguments', () => {
  it('reads single values and lists of them', () => {
    expect(
      readArguments('{"a":"x","b":2,"c":false,"d":["p","q"]}'),
    ).toEqual({ a: 'x', b: 2, c: false, d: ['p', 'q'] });
  });

  it('reads nothing streamed as a call with no arguments', () => {
    expect(readArguments('')).toEqual({});
    expect(readArguments(' '.repeat(3))).toEqual({});
  });

  it('refuses what is not readable as JSON', () => {
    expect(readArguments('{"a":')).toBeNull();
    expect(readArguments('not json')).toBeNull();
  });

  it('refuses JSON that is not a set of named arguments', () => {
    expect(readArguments('["a","b"]')).toBeNull();
    expect(readArguments('"a string"')).toBeNull();
    expect(readArguments('null')).toBeNull();
  });

  it('refuses a value that could not be carried as the value it was', () => {
    expect(readArguments('{"nested":{"a":1}}')).toBeNull();
    expect(readArguments('{"mixed":["a",{"b":1}]}')).toBeNull();
  });

  it('refuses a number JSON allows but the workbench cannot carry', () => {
    expect(readArguments('{"n":1e400}')).toBeNull();
  });
});

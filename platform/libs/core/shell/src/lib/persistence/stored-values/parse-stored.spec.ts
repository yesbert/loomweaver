import { parseStored } from './parse-stored';

describe('parseStored', () => {
  it('reads a stored JSON value', () => {
    expect(parseStored('{"a":[1,2]}')).toEqual({ a: [1, 2] });
  });

  it('answers nothing for a missing or unreadable value, never throwing', () => {
    expect(parseStored(undefined)).toBeUndefined();
    expect(parseStored(null)).toBeUndefined();
    expect(parseStored('')).toBeUndefined();
    expect(parseStored('{not json')).toBeUndefined();
  });
});

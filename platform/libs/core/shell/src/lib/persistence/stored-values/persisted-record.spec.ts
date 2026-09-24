import { isTrue, parseRecord, recordOf, toggledFlag } from './persisted-record';

const isNumber = (value: unknown): value is number => typeof value === 'number';

describe('persisted records', () => {
  it('keeps only the entries whose value has the expected kind', () => {
    expect(parseRecord('{"a":1,"b":"x","c":2}', isNumber)).toEqual({
      a: 1,
      c: 2,
    });
  });

  it('reads nothing from a missing, broken or non-object value', () => {
    expect(parseRecord(undefined, isNumber)).toEqual({});
    expect(parseRecord('{broken', isNumber)).toEqual({});
    expect(parseRecord('[1,2]', isNumber)).toEqual({});
    expect(recordOf('text', isNumber)).toEqual({});
  });

  it('sets a flag and removes it again rather than storing false', () => {
    const on = toggledFlag({}, 'left', true);

    expect(on).toEqual({ left: true });
    expect(toggledFlag(on, 'left', false)).toEqual({});
    expect(parseRecord('{"left":true,"right":false}', isTrue)).toEqual({
      left: true,
    });
  });
});

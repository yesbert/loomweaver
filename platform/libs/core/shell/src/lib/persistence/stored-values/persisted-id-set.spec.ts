import { parseIdSet } from './persisted-id-set';

describe('parseIdSet', () => {
  it('drops garbage instead of throwing', () => {
    expect(parseIdSet(undefined).size).toBe(0);
    expect(parseIdSet('{not json').size).toBe(0);
    expect(parseIdSet('{"a":1}').size).toBe(0);
    expect([...parseIdSet('["a",1,null,"b"]')]).toEqual(['a', 'b']);
  });
});

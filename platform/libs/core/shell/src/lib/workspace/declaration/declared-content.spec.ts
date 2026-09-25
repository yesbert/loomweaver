import { declaredTabPaths } from './declared-content';

describe('declaredTabPaths', () => {
  it('collects every declared tab path across the arrangement', () => {
    expect(
      declaredTabPaths({
        id: 'ws',
        title: 'k.ws',
        content: {
          columns: [
            { tabs: ['a'] },
            { rows: [{ tabs: ['b'] }, { tabs: ['c'] }] },
          ],
        },
      }),
    ).toEqual(['a', 'b', 'c']);
  });
});

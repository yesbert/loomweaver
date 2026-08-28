import { testbedNavState } from './testbed-nav-state';

describe('testbedNavState', () => {
  beforeEach(() => testbedNavState.reset());

  it('starts from the default items', () => {
    expect(testbedNavState.items()).toEqual([
      'Item C',
      'Item A',
      'Item B',
    ]);
  });

  it('appends a numbered item on add', () => {
    testbedNavState.add();
    expect(testbedNavState.items()).toEqual([
      'Item C',
      'Item A',
      'Item B',
      'Item 4',
    ]);
  });

  it('sorts the items alphabetically', () => {
    testbedNavState.sort();
    expect(testbedNavState.items()).toEqual(['Item A', 'Item B', 'Item C']);
  });

  it('restores the defaults on reset', () => {
    testbedNavState.add();
    testbedNavState.add();
    testbedNavState.reset();
    expect(testbedNavState.items()).toEqual([
      'Item C',
      'Item A',
      'Item B',
    ]);
  });
});

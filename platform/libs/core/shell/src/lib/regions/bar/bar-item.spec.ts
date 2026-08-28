import { BAR_ITEM, BarItem, provideBarItems } from '../../foundation/bar-item';

class DummyItem {}

describe('provideBarItems', () => {
  it('hooks each item as a multi-provider for BAR_ITEM', () => {
    const brand: BarItem = {
      id: 'a',
      bar: 'top-bar',
      slot: 'start',
      component: DummyItem,
    };
    const action: BarItem = {
      id: 'b',
      bar: 'top-bar',
      slot: 'end',
      order: 5,
      component: DummyItem,
    };

    expect(provideBarItems(brand, action)).toEqual([
      { provide: BAR_ITEM, useValue: brand, multi: true },
      { provide: BAR_ITEM, useValue: action, multi: true },
    ]);
  });
});

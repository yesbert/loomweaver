import { menuOnActivate, menuOnContext } from './chrome-item-menu';

describe('the menu a chrome item opens', () => {
  it('opens its slot on activation only where the item asks for that gesture', () => {
    expect(menuOnActivate({ id: 'a', menu: 'own' })).toBeUndefined();
    expect(menuOnActivate({ id: 'a', menu: 'own', menuTrigger: 'context' })).toBeUndefined();
    expect(menuOnActivate({ id: 'a', menu: 'own', menuTrigger: 'primary' })).toBe('own');
    expect(menuOnActivate({ id: 'a', menu: 'own', menuTrigger: 'both' })).toBe('own');
  });

  it('keeps the right-click for a workspace entry, whatever it asks for', () => {
    expect(menuOnActivate({ id: 'a', menu: 'own', menuTrigger: 'primary', workspace: 'w' })).toBeUndefined();
    expect(menuOnContext({ id: 'a', menu: 'own', menuTrigger: 'primary', workspace: 'w' })).toBe('own');
  });

  it("opens a toolbar entry's submenu on activation without a context menu of its own", () => {
    expect(menuOnActivate({ submenu: 'nested' })).toBe('nested');
    expect(menuOnContext({ submenu: 'nested' })).toBeUndefined();
  });

  it('keeps the context menu where activation takes the primary gesture alone', () => {
    expect(menuOnContext({ id: 'a', menu: 'own', menuTrigger: 'primary' })).toBeUndefined();
    expect(menuOnContext({ id: 'a', menu: 'own', menuTrigger: 'both' })).toBe('own');
    expect(menuOnContext({ id: 'a', menu: 'own' })).toBe('own');
  });
});

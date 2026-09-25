import type { MenuItem, PluginContext, RailItem } from '@loomweaver/plugin-sdk';
import { demoSession } from './session';
import { sessionActions } from './session-actions';

interface Drawn {
  readonly railItems: RailItem[];
  readonly menuItems: MenuItem[];
  readonly disposed: string[];
}

function bind(): Drawn {
  const drawn: Drawn = { railItems: [], menuItems: [], disposed: [] };
  sessionActions.bind({
    registerRailItem: (item: RailItem) => {
      drawn.railItems.push(item);
      return { dispose: () => drawn.disposed.push(item.id) };
    },
    registerMenuItem: (item: MenuItem) => {
      drawn.menuItems.push(item);
      return { dispose: () => drawn.disposed.push(item.id ?? '') };
    },
  } as unknown as PluginContext);
  return drawn;
}

function current(drawn: Drawn): RailItem {
  return drawn.railItems[drawn.railItems.length - 1];
}

function offered(drawn: Drawn): string[] {
  const live = drawn.menuItems.filter(
    (item) => !drawn.disposed.includes(item.id ?? ''),
  );
  return live.map((item) => item.command ?? '');
}

describe('the account entry', () => {
  afterEach(() => {
    sessionActions.unbind();
    demoSession.signIn();
    localStorage.clear();
  });

  it('is drawn from the person it stands for, and opens its menu on an ordinary click', () => {
    const drawn = bind();

    const entry = current(drawn);

    expect(entry.title).toBe('Gambit the Cat');
    expect(entry.initials).toBe('GC');
    expect(entry.menuTrigger).toBe('primary');
    expect(entry.menuHeader?.title).toBe('Gambit the Cat');
    expect(entry.menuHeader?.detail).toBe('product.role.accounting');
  });

  it('carries the picture of the account that has one', () => {
    const drawn = bind();

    expect(current(drawn).image).toBe('avatar-gambit.jpg');
  });

  it('falls back to initials for the account without a picture', () => {
    const drawn = bind();

    sessionActions.switchAccount();

    const entry = current(drawn);
    expect(entry.title).toBe('Jonas Weiler');
    expect(entry.initials).toBe('JW');
    expect(entry.image).toBeUndefined();
  });

  it('keeps its place in the rail when the account changes', () => {
    const drawn = bind();
    const before = current(drawn);

    sessionActions.switchAccount();

    const after = current(drawn);
    expect(after.id).toBe(before.id);
    expect(after.rail).toBe(before.rail);
    expect(after.anchor).toBe(before.anchor);
    expect(after.order).toBe(before.order);
    expect(drawn.disposed).toContain('session.account');
  });

  it('offers switching and signing out while someone is signed in', () => {
    const drawn = bind();

    expect(offered(drawn)).toEqual([
      'session.switchAccount',
      'session.signOut',
    ]);
  });

  it('offers signing in once signed out, and stays in the rail', () => {
    const drawn = bind();

    sessionActions.signOut();

    expect(offered(drawn)).toEqual(['session.signIn']);
    expect(current(drawn).title).toBe('product.signIn');
    expect(current(drawn).menuHeader?.title).toBe('product.account.signedOut');
  });
});

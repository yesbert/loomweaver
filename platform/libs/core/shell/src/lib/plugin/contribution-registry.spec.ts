import { TestBed } from '@angular/core/testing';
import { ContributionRegistry } from './contribution-registry';
import { BarItem } from '../foundation/bar-item';
import { View } from '../layout/view';

class DummyComponent {}

const view: View = {
  id: 'v',
  region: 'primary',
  title: 't',
  component: DummyComponent,
};
const barItem: BarItem = {
  id: 'b',
  bar: 'top-bar',
  slot: 'start',
  component: DummyComponent,
};

describe('ContributionRegistry', () => {
  let registry: ContributionRegistry;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    registry = TestBed.inject(ContributionRegistry);
  });

  it('starts empty', () => {
    expect(registry.commands()).toEqual([]);
    expect(registry.views()).toEqual([]);
    expect(registry.barItems()).toEqual([]);
  });

  it('adds and removes a command via its Disposable', () => {
    const command = { id: 'c', title: 't', run: () => undefined };
    const handle = registry.addCommand(command);
    expect(registry.commands()).toEqual([command]);

    handle.dispose();
    expect(registry.commands()).toEqual([]);
  });

  it('removes a command by id', () => {
    registry.addCommand({ id: 'c', title: 't', run: () => undefined });
    registry.removeCommandById('c');
    expect(registry.commands()).toEqual([]);
  });

  it('omit hides a contribution across every kind it covers', () => {
    registry.addCommand({ id: 'gone', title: 't', run: () => undefined });
    registry.addView({ ...view, id: 'gone' });
    registry.omit(['gone']);

    expect(registry.commands()).toEqual([]);
    expect(registry.views()).toEqual([]);
  });

  it('omit is lasting — an id a plugin registers afterwards stays hidden', () => {
    registry.omit(['late']);
    registry.addRailItem({
      id: 'late',
      rail: 'activity',
      icon: 'i',
      title: 't',
    });

    expect(registry.railItems()).toEqual([]);
  });

  it('leaves contributions with other ids untouched', () => {
    const keep = { id: 'keep', title: 't', run: () => undefined };
    registry.addCommand(keep);
    registry.omit(['other']);

    expect(registry.commands()).toEqual([keep]);
  });

  it('adds and removes a view via its Disposable', () => {
    const handle = registry.addView(view);
    expect(registry.views()).toEqual([view]);

    handle.dispose();
    expect(registry.views()).toEqual([]);
  });

  it('adds and removes a bar item via its Disposable', () => {
    const handle = registry.addBarItem(barItem);
    expect(registry.barItems()).toEqual([barItem]);

    handle.dispose();
    expect(registry.barItems()).toEqual([]);
  });

  it('overrides an existing id in place (last contribution wins)', () => {
    const override: BarItem = {
      id: 'b',
      bar: 'status-bar',
      slot: 'end',
      component: DummyComponent,
    };
    registry.addBarItem({
      id: 'a',
      bar: 'top-bar',
      slot: 'start',
      component: DummyComponent,
    });
    registry.addBarItem(barItem);
    registry.addBarItem(override);

    expect(registry.barItems().map((index) => index.id)).toEqual(['a', 'b']);
    expect(registry.barItems()[1]).toBe(override);
  });

  it('disposing a superseded contribution is a no-op', () => {
    const handle = registry.addBarItem(barItem);
    const override: BarItem = {
      id: 'b',
      bar: 'status-bar',
      slot: 'end',
      component: DummyComponent,
    };
    registry.addBarItem(override);

    handle.dispose();
    expect(registry.barItems()).toEqual([override]);
  });

  it('removes a contribution by id', () => {
    registry.addView(view);
    registry.addBarItem(barItem);

    registry.removeViewById('v');
    registry.removeBarItemById('b');

    expect(registry.views()).toEqual([]);
    expect(registry.barItems()).toEqual([]);
  });

  it('menu items without an id stack additively', () => {
    registry.addMenuItem({ menu: 'm', command: 'c1' });
    registry.addMenuItem({ menu: 'm', command: 'c1' });
    expect(registry.menuItems().length).toBe(2);
  });

  it('a menu item with an id is replaced in place (last contribution wins)', () => {
    registry.addMenuItem({ id: 'menu:c1', menu: 'm', command: 'c1', order: 0 });
    const override = { id: 'menu:c1', menu: 'm', command: 'c2', order: 5 };
    registry.addMenuItem(override);

    expect(registry.menuItems()).toEqual([override]);
  });

  it('removes a menu item by id and leaves id-less items alone', () => {
    registry.addMenuItem({ id: 'menu:c1', menu: 'm', command: 'c1' });
    registry.addMenuItem({ menu: 'm', command: 'c2' });

    registry.removeMenuItemById('menu:c1');

    expect(registry.menuItems().map((index) => index.command)).toEqual(['c2']);
  });

  describe('content route plugin ownership', () => {
    it('stamps the owning plugin so a surface can be checked against its grants', () => {
      registry.addContentRoute(
        { path: 'notes', component: DummyComponent },
        'testbed',
      );

      expect(registry.contentRoutes()[0].pluginId).toBe('testbed');
    });

    it('a plugin cannot claim someone else’s identity — the host stamp wins', () => {
      const spoofed = {
        path: 'notes',
        component: DummyComponent,
        pluginId: 'trusted-bank',
      };

      registry.addContentRoute(spoofed as never, 'evil');

      expect(registry.contentRoutes()[0].pluginId).toBe('evil');
    });

    it('leaves the id undefined for routes no plugin registered', () => {
      registry.addContentRoute({ path: 'notes', component: DummyComponent });

      expect(registry.contentRoutes()[0].pluginId).toBeUndefined();
    });
  });

  describe('view plugin ownership', () => {
    it('stamps the owning plugin and the host stamp wins over a spoofed one', () => {
      registry.addView({ ...view, pluginId: 'trusted-bank' } as never, 'testbed');

      expect(registry.views()[0].pluginId).toBe('testbed');
    });

    it('leaves the id undefined for views no plugin registered', () => {
      registry.addView(view);

      expect(registry.views()[0].pluginId).toBeUndefined();
    });
  });

  describe('content route omission', () => {
    const route = {
      id: 'testbed.notes',
      path: 'notes',
      component: DummyComponent,
    };

    it('route:<id> takes the route out of contentRoutes and surfaces it as omitted', () => {
      registry.addContentRoute(route);
      registry.omit(['route:testbed.notes']);

      expect(registry.contentRoutes()).toEqual([]);
      expect(registry.omittedContentRoutes()).toEqual([route]);
    });

    it('a bare id never touches a route — the prefix keeps the shared omit set collision-free', () => {
      registry.addContentRoute(route);
      registry.omit(['testbed.notes']);

      expect(registry.contentRoutes()).toEqual([route]);
      expect(registry.omittedContentRoutes()).toEqual([]);
    });

    it('omitting a route leaves a same-named command alive', () => {
      const command = { id: 'testbed.notes', title: 't', run: () => undefined };
      registry.addContentRoute(route);
      registry.addCommand(command);

      registry.omit(['route:testbed.notes']);

      expect(registry.contentRoutes()).toEqual([]);
      expect(registry.commands()).toEqual([command]);
    });

    it('is lasting — a route registered after the omit stays hidden', () => {
      registry.omit(['route:testbed.notes']);
      registry.addContentRoute(route);

      expect(registry.contentRoutes()).toEqual([]);
      expect(registry.omittedContentRoutes()).toEqual([route]);
    });

    it('leaves an id-less route alone', () => {
      const anonymous = { path: 'notes', component: DummyComponent };
      registry.addContentRoute(anonymous);
      registry.omit(['route:testbed.notes']);

      expect(registry.contentRoutes()).toEqual([anonymous]);
    });
  });
});
describe('one stored list, two derived views', () => {
  let registry: ContributionRegistry;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    registry = TestBed.inject(ContributionRegistry);
  });

  it('keeps a view and a route that share an id apart', () => {
    registry.addView({ ...view, id: 'shared' });
    registry.addContentRoute({
      id: 'shared',
      path: 'shared',
      component: DummyComponent,
    });

    expect(registry.views().map((v) => v.id)).toEqual(['shared']);
    expect(registry.contentRoutes().map((r) => r.path)).toEqual(['shared']);
  });

  it('removes only the view when a route shares its id', () => {
    registry.addView({ ...view, id: 'shared' });
    registry.addContentRoute({
      id: 'shared',
      path: 'shared',
      component: DummyComponent,
    });

    registry.removeViewById('shared');

    expect(registry.views()).toEqual([]);
    expect(registry.contentRoutes()).toHaveLength(1);
  });

  it('hands the same view object back when an unrelated route is registered', () => {
    registry.addView(view);
    const before = registry.views()[0];

    registry.addContentRoute({ path: 'elsewhere', component: DummyComponent });

    expect(registry.views()[0]).toBe(before);
  });
});

describe('omit covers commands by bare id (finding #28 — works as documented)', () => {
  it('a lasting omit hides a host-seeded command from commands() — palette and keybindings derive from it', () => {
    const registry = new ContributionRegistry();
    registry.omit(['shell.openSettings']);
    registry.addCommand({
      id: 'shell.openSettings',
      title: 't',
      run: () => undefined,
    });
    registry.addCommand({ id: 'kept', title: 't', run: () => undefined });

    expect(registry.commands().map((c) => c.id)).toEqual(['kept']);
  });
});

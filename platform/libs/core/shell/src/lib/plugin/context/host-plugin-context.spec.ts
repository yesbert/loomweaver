import { effect, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Capability, CapabilityError } from '@loomweaver/plugin-sdk';
import { HostPluginContext } from './host-plugin-context';
import { LeftOutChildren } from '../../regions/pane/container/left-out-children';
import { CONTAINER_CHILD_REGION } from '../../contributions/surface-normalize';
import { VIEW_PANE_PREFIX } from '../../regions/pane/tree/pane-address';
import { ALL, DummyComponent, makeContext } from './host-context-harness';
import { resolveIcon } from '../../elements/icon/icon-registry';

function contribute(ctx: HostPluginContext): void {
  ctx.registerCommand({ id: 'c', title: 't', run: () => undefined });
  ctx.registerSurface({
    id: 'v',
    docks: ['primary'],
    title: 't',
    component: DummyComponent,
  });
  ctx.registerBarItem({
    id: 'b',
    bar: 'top-bar',
    slot: 'start',
    component: DummyComponent,
  });
  ctx.registerRailItem({
    id: 'r',
    rail: 'activity',
    icon: 'settings',
    title: 't',
    run: () => undefined,
  });
  ctx.registerSettingsSection({ id: 's', title: 's.title', rows: [] });
}

describe('HostPluginContext', () => {
  it('tracks every contribution and undoes them all on disposeAll', () => {
    const { ctx, registry, settings } = makeContext();

    contribute(ctx);
    expect(registry.commands()).toHaveLength(1);
    expect(registry.views()).toHaveLength(1);
    expect(registry.barItems()).toHaveLength(1);
    expect(registry.railItems()).toHaveLength(1);
    expect(settings.all()).toHaveLength(1);

    ctx.disposeAll();

    expect(registry.commands()).toHaveLength(0);
    expect(registry.views()).toHaveLength(0);
    expect(registry.barItems()).toHaveLength(0);
    expect(registry.railItems()).toHaveLength(0);
    expect(settings.all()).toHaveLength(0);
  });

  describe('contributeIcons', () => {
    it('contributes icon names resolvable from the registry, and removes them on disposeAll', () => {
      const { ctx } = makeContext();

      ctx.contributeIcons({ pluginGlyph: '<svg/>' });
      expect(resolveIcon('pluginGlyph')).toBe('<svg></svg>');

      ctx.disposeAll();
      expect(resolveIcon('pluginGlyph')).toBeUndefined();
    });
  });

  describe('contributeTheme', () => {
    it('is denied without the theme capability (default-deny)', () => {
      const { ctx } = makeContext(['contributions', 'ui']);
      expect(() => ctx.contributeTheme({ '--lw-brand': '#0e7490' })).toThrow(
        CapabilityError,
      );
    });

    it('registers with the theme capability and bumps the registry version, reverting on disposeAll', () => {
      const { ctx, themes } = makeContext();
      const before = themes.revision();

      ctx.contributeTheme({ '--lw-brand': '#0e7490' });
      expect(themes.revision()).toBe(before + 1);

      ctx.disposeAll();
      expect(themes.revision()).toBe(before + 2);
    });

    it('passes dark-mode overrides through to the registry', () => {
      const { ctx, themes } = makeContext();
      const spy = vi.spyOn(themes, 'register');

      ctx.contributeTheme(
        { '--lw-surface': '#fff' },
        { '--lw-surface': '#111' },
      );

      expect(spy).toHaveBeenCalledWith(
        expect.any(String),
        { '--lw-surface': '#fff' },
        { '--lw-surface': '#111' },
      );
    });
  });

  describe('content routes + navigation', () => {
    it('registers a content route and removes it on disposeAll', () => {
      const { ctx, registry } = makeContext();

      ctx.registerSurface({
        id: 'doc',
        title: 'doc.title',
        routable: { path: 'doc/:id' },
        component: DummyComponent,
      });
      expect(registry.contentRoutes()).toHaveLength(1);

      ctx.disposeAll();
      expect(registry.contentRoutes()).toHaveLength(0);
    });

    it('delegates navigate / open / close to the content tabs service', () => {
      const { ctx, tabs } = makeContext();

      ctx.navigateContent('dashboard');
      ctx.openContentTab({ path: 'doc/abc', title: 'Doc' });
      ctx.closeContentTab('doc/abc');

      expect(tabs.navigate).toHaveBeenCalledWith('dashboard');
      expect(tabs.open).toHaveBeenCalledWith({ path: 'doc/abc', title: 'Doc' });
      expect(tabs.close).toHaveBeenCalledWith('doc/abc');
    });

    it('requires the "navigation" capability for imperative content navigation', () => {
      const { ctx, tabs } = makeContext(['contributions']);
      expect(() => ctx.navigateContent('x')).toThrow(CapabilityError);
      expect(() => ctx.openContentTab({ path: 'x', title: 'x' })).toThrow(
        CapabilityError,
      );
      expect(() => ctx.closeContentTab('x')).toThrow(CapabilityError);
      expect(() => ctx.revealSurface('x')).toThrow(CapabilityError);
      expect(tabs.navigate).not.toHaveBeenCalled();
    });

    it('exposes the host active-content read through ctx.activeContent', () => {
      const { ctx, tabs } = makeContext();
      expect(ctx.activeContent).toBe(tabs.activeContent);
    });

    it('requires the "navigation" capability for ctx.activeContent', () => {
      const { ctx } = makeContext(['contributions']);
      expect(() => ctx.activeContent).toThrow(CapabilityError);
    });
  });

  describe('renaming a surface', () => {
    it('replaces the title the workbench names it by, and nothing else', () => {
      const { ctx, registry } = makeContext();
      ctx.registerSurface({
        id: 'nav',
        docks: ['primary'],
        title: 'nav.first',
        icon: 'navigator',
        component: DummyComponent,
      });

      ctx.retitleSurface('nav', 'nav.second');

      const view = registry.views()[0];
      expect(view.title).toBe('nav.second');
      expect(view.icon).toBe('navigator');
      expect(registry.views()).toHaveLength(1);
    });

    it('leaves an id nothing was registered under alone', () => {
      const { ctx, registry } = makeContext();
      ctx.registerSurface({
        id: 'nav',
        docks: ['primary'],
        title: 'nav.first',
        component: DummyComponent,
      });

      ctx.retitleSurface('other', 'nav.second');

      expect(registry.views()[0].title).toBe('nav.first');
    });

    it('leaves a surface another plugin registered alone', () => {
      const { ctx, registry } = makeContext();
      registry.addView(
        {
          id: 'theirs',
          region: 'primary',
          title: 't',
          component: DummyComponent,
        },
        'another-plugin',
      );

      ctx.retitleSurface('theirs', 'hijacked');

      expect(registry.views()[0].title).toBe('t');
    });

    it('needs the "contributions" capability', () => {
      const { ctx } = makeContext(['ui', 'host']);

      expect(() => ctx.retitleSurface('nav', 'x')).toThrow(CapabilityError);
    });
  });

  describe('a surface badge', () => {
    const BETA = { text: 'badges.beta', tone: 'brand' } as const;

    function nav(ctx: HostPluginContext, badge?: typeof BETA) {
      return ctx.registerSurface({
        id: 'nav',
        docks: ['primary'],
        title: 'nav.first',
        component: DummyComponent,
        ...(badge && { badge }),
      });
    }

    it('takes the badge a surface declares', () => {
      const { ctx, registry } = makeContext();
      nav(ctx, BETA);

      expect(registry.badgeOf('nav')).toEqual(BETA);
    });

    it('replaces it, takes it away, and leaves an unknown id alone', () => {
      const { ctx, registry } = makeContext();
      nav(ctx);

      ctx.updateSurfaceBadge('nav', BETA);
      expect(registry.badgeOf('nav')).toEqual(BETA);

      ctx.updateSurfaceBadge('other', BETA);
      expect(registry.badgeOf('other')).toBeUndefined();

      ctx.updateSurfaceBadge('nav', null);
      expect(registry.badgeOf('nav')).toBeUndefined();
    });

    it('does not rebuild the surface', () => {
      const { ctx, registry } = makeContext();
      nav(ctx);
      const before = registry.views()[0];

      ctx.updateSurfaceBadge('nav', BETA);

      expect(registry.views()[0]).toBe(before);
    });

    it('goes with the surface when it is disposed, and when it is registered again without one', () => {
      const { ctx, registry } = makeContext();
      const first = nav(ctx, BETA);
      nav(ctx);
      expect(registry.badgeOf('nav')).toBeUndefined();

      ctx.updateSurfaceBadge('nav', BETA);
      first.dispose();
      nav(ctx, BETA).dispose();
      expect(registry.badgeOf('nav')).toBeUndefined();
    });

    it('needs the "contributions" capability', () => {
      const { ctx } = makeContext(['ui', 'host']);

      expect(() => ctx.updateSurfaceBadge('nav', BETA)).toThrow(
        CapabilityError,
      );
    });

    it("leaves another plugin's surface alone", () => {
      const { ctx, registry } = makeContext();
      registry.addView(
        {
          id: 'theirs',
          region: 'primary',
          title: 't',
          component: DummyComponent,
        },
        'another-plugin',
      );

      ctx.updateSurfaceBadge('theirs', BETA);

      expect(registry.badgeOf('theirs')).toBeUndefined();
    });

    it('can be changed from an effect without the effect running again on its own', () => {
      const { ctx, registry } = makeContext();
      nav(ctx);
      const flagged = signal(false);
      let runs = 0;
      TestBed.runInInjectionContext(() =>
        effect(() => {
          runs += 1;
          ctx.updateSurfaceBadge('nav', flagged() ? BETA : null);
        }),
      );
      TestBed.tick();
      flagged.set(true);
      TestBed.tick();

      expect(registry.badgeOf('nav')).toEqual(BETA);
      expect(runs).toBe(2);
    });

    it('goes with a view removed by its id', () => {
      const { ctx, registry } = makeContext();
      nav(ctx, BETA);

      registry.removeViewById('nav');

      expect(registry.badgeOf('nav')).toBeUndefined();
    });
  });

  describe('updating an open tab in place', () => {
    it('hands the change to the tab service under the calling plugin', () => {
      const { ctx, tabs } = makeContext();
      const badge = { text: 'Sent', textIsLiteral: true } as const;

      ctx.updateContentTab('doc/a', { badge });

      expect(tabs.update).toHaveBeenCalledWith(
        'doc/a',
        { badge },
        'test-plugin',
      );
    });

    it('needs the "contributions" capability', () => {
      const { ctx } = makeContext(['ui', 'host', 'navigation']);

      expect(() => ctx.updateContentTab('doc/a', { badge: null })).toThrow(
        CapabilityError,
      );
    });
  });

  describe('leaving a container child out', () => {
    function child(ctx: HostPluginContext, id = 'pane.child') {
      return ctx.registerSurface({
        id,
        docks: [],
        title: 'child.title',
        component: DummyComponent,
      });
    }

    it('leaves out a child the plugin registered, and brings it back', () => {
      const { ctx } = makeContext();
      child(ctx);
      const leftOut = TestBed.inject(LeftOutChildren);

      ctx.setChildShown('pane.child', false);
      expect(leftOut.hides(`${VIEW_PANE_PREFIX}pane.child`)).toBe(true);

      ctx.setChildShown('pane.child', true);
      expect(leftOut.hides(`${VIEW_PANE_PREFIX}pane.child`)).toBe(false);
    });

    it('changes nothing for a surface that is not a container child, and says so in development', () => {
      const warn = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);
      const { ctx } = makeContext();
      ctx.registerSurface({
        id: 'docked',
        docks: ['primary'],
        title: 'docked.title',
        component: DummyComponent,
      });

      ctx.setChildShown('docked', false);
      ctx.setChildShown('unknown', false);

      expect(
        TestBed.inject(LeftOutChildren).hides(`${VIEW_PANE_PREFIX}docked`),
      ).toBe(false);
      expect(
        TestBed.inject(LeftOutChildren).hides(`${VIEW_PANE_PREFIX}unknown`),
      ).toBe(false);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('"docked"'));
      warn.mockRestore();
    });

    it("leaves another plugin's child alone", () => {
      const warn = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);
      const { ctx, registry } = makeContext();
      registry.addView(
        {
          id: 'theirs',
          region: CONTAINER_CHILD_REGION,
          title: 't',
          component: DummyComponent,
        },
        'another-plugin',
      );

      ctx.setChildShown('theirs', false);

      expect(
        TestBed.inject(LeftOutChildren).hides(`${VIEW_PANE_PREFIX}theirs`),
      ).toBe(false);
      warn.mockRestore();
    });

    it('needs the "contributions" capability', () => {
      const { ctx } = makeContext(['ui', 'host']);

      expect(() => ctx.setChildShown('pane.child', false)).toThrow(
        CapabilityError,
      );
    });
  });

  describe("replacing one of a surface's actions", () => {
    const first = { id: 'a', icon: 'add', title: 'act.add' };
    const second = { id: 'b', icon: 'pin', title: 'act.pin', pressed: false };

    function registered(granted?: Capability[]) {
      const made = makeContext(granted);
      made.ctx.registerSurface({
        id: 'nav',
        docks: ['primary'],
        title: 'nav.first',
        icon: 'navigator',
        actions: [first, second],
        component: DummyComponent,
      });
      return made;
    }

    it('replaces the action named, and leaves the rest of the surface alone', () => {
      const { ctx, registry } = registered();
      const flipped = {
        ...second,
        icon: 'unpin',
        title: 'act.unpin',
        pressed: true,
      };

      ctx.updateSurfaceAction('nav', flipped);

      const view = registry.views()[0];
      expect(view.actions).toEqual([first, flipped]);
      expect(view.title).toBe('nav.first');
      expect(view.icon).toBe('navigator');
      expect(registry.views()).toHaveLength(1);
    });

    it('adds an action the surface did not carry', () => {
      const { ctx, registry } = registered();
      const third = { id: 'c', icon: 'sort', title: 'act.sort' };

      ctx.updateSurfaceAction('nav', third);

      expect(registry.views()[0].actions).toEqual([first, second, third]);
    });

    it('leaves a surface id nothing was registered under alone', () => {
      const { ctx, registry } = registered();

      ctx.updateSurfaceAction('other', { ...first, title: 'act.other' });

      expect(registry.views()[0].actions).toEqual([first, second]);
    });

    it('leaves a surface another plugin registered alone', () => {
      const { ctx, registry } = makeContext();
      registry.addView(
        {
          id: 'theirs',
          region: 'primary',
          title: 't',
          actions: [first],
          component: DummyComponent,
        },
        'another-plugin',
      );

      ctx.updateSurfaceAction('theirs', { ...first, run: () => undefined });

      expect(registry.views()[0].actions).toEqual([first]);
    });

    it('needs the "contributions" capability', () => {
      const { ctx } = makeContext(['ui', 'host']);

      expect(() => ctx.updateSurfaceAction('nav', first)).toThrow(
        CapabilityError,
      );
    });
  });

  describe('asking whether the address shown lies under one', () => {
    it('counts the address itself and anything below it', () => {
      const { ctx, shown } = makeContext();
      shown.set({ path: 'sales/quotes/q-0006' });

      expect(ctx.isShowingUnder('sales/quotes')).toBe(true);
      expect(ctx.isShowingUnder('sales')).toBe(true);
      expect(ctx.isShowingUnder('sales/quotes/q-0006')).toBe(true);
    });

    it('does not mistake a longer name for a deeper address', () => {
      const { ctx, shown } = makeContext();
      shown.set({ path: 'sales/quotesomething' });

      expect(ctx.isShowingUnder('sales/quotes')).toBe(false);
    });

    it('answers no while nothing addressable is shown', () => {
      const { ctx } = makeContext();

      expect(ctx.isShowingUnder('sales')).toBe(false);
    });

    it('needs the same capability as reading the active content', () => {
      const { ctx } = makeContext(['contributions']);

      expect(() => ctx.isShowingUnder('sales')).toThrow(CapabilityError);
    });
  });

  describe('default-deny', () => {
    it('rejects contributions without the "contributions" capability', () => {
      const { ctx, registry } = makeContext(['ui', 'host']);
      expect(() =>
        ctx.registerSurface({
          id: 'v',
          docks: ['primary'],
          title: 't',
          component: DummyComponent,
        }),
      ).toThrow(CapabilityError);
      expect(() =>
        ctx.registerCommand({ id: 'c', title: 't', run: () => undefined }),
      ).toThrow(CapabilityError);
      expect(() => ctx.contributeIcons({ pluginGlyph: '<svg/>' })).toThrow(
        CapabilityError,
      );
      expect(registry.views()).toHaveLength(0);
      expect(registry.commands()).toHaveLength(0);
    });

    it('rejects ctx.ui use without the "ui" capability', () => {
      const { ctx, notifications } = makeContext(['contributions', 'host']);
      expect(() => ctx.ui.toast({ message: 'hi' })).toThrow(CapabilityError);
      expect(notifications.notifications()).toHaveLength(0);
    });

    it('rejects ctx.host access without the "host" capability', () => {
      const { ctx } = makeContext(['contributions', 'ui']);
      expect(() => ctx.host).toThrow(CapabilityError);
    });

    it('denies everything when nothing is granted', () => {
      const { ctx } = makeContext([]);
      expect(() =>
        ctx.registerRailItem({
          id: 'r',
          rail: 'activity',
          icon: 'x',
          title: 't',
          run: () => undefined,
        }),
      ).toThrow(CapabilityError);
      expect(() => ctx.ui.alert({ message: 'x' })).toThrow(CapabilityError);
      expect(() => ctx.host).toThrow(CapabilityError);
    });

    it('names the missing capability + plugin id on the error', () => {
      const { ctx } = makeContext([]);
      try {
        ctx.host.version();
        throw new Error('expected a CapabilityError');
      } catch (error) {
        expect(error).toBeInstanceOf(CapabilityError);
        expect((error as CapabilityError).capability).toBe('host');
        expect((error as CapabilityError).pluginId).toBe('test-plugin');
      }
    });
  });
});

describe('HostPluginContext command invocation', () => {
  it('stamps the calling plugin as the owner of a command it registers', () => {
    const { ctx, registry } = makeContext();

    ctx.registerCommand({ id: 'mine.go', title: 't', run: () => undefined });

    expect(registry.registeredCommands()[0].ownerId).toBe('test-plugin');
  });

  it("refuses another plugin's opened command without the automation grant", async () => {
    const { ctx, registry } = makeContext(
      ALL.filter((capability) => capability !== 'automation'),
    );
    const run = vi.fn();
    registry.addCommand(
      { id: 'other.go', title: 't', callable: true, run },
      'other-plugin',
    );

    expect((await ctx.invokeCommand('other.go')).outcome).toBe('refused');
    expect(ctx.invocableCommands()).toHaveLength(0);
    expect(run).not.toHaveBeenCalled();
  });

  it("reaches another plugin's opened command with the automation grant", async () => {
    const { ctx, registry } = makeContext();
    const run = vi.fn();
    registry.addCommand(
      { id: 'other.go', title: 't', callable: true, run },
      'other-plugin',
    );

    expect((await ctx.invokeCommand('other.go')).outcome).toBe('answered');
    expect(ctx.invocableCommands().map((entry) => entry.id)).toEqual([
      'other.go',
    ]);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('reaches its own command without the automation grant', async () => {
    const { ctx } = makeContext(
      ALL.filter((capability) => capability !== 'automation'),
    );
    const run = vi.fn();
    ctx.registerCommand({ id: 'mine.go', title: 't', run });

    expect((await ctx.invokeCommand('mine.go')).outcome).toBe('answered');
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('follows a revocation on the next call, without a reload', async () => {
    const { ctx, registry, grants } = makeContext();
    registry.addCommand(
      { id: 'other.go', title: 't', callable: true, run: vi.fn() },
      'other-plugin',
    );

    expect((await ctx.invokeCommand('other.go')).outcome).toBe('answered');

    grants.delete('automation');

    expect((await ctx.invokeCommand('other.go')).outcome).toBe('refused');
    expect(ctx.invocableCommands()).toHaveLength(0);
  });

  it('reads unsaved work for a surface it registered, with nothing granted', () => {
    const { ctx, registry } = makeContext([]);
    registry.addContentRoute(
      { path: 'quotes/:id', component: DummyComponent } as never,
      'test-plugin',
    );

    expect(ctx.hasUnsavedWork('quotes/q-7')).toBe(true);
  });

  it('is told nothing about a surface another plugin registered', () => {
    const { ctx, registry } = makeContext();
    registry.addContentRoute(
      { path: 'invoices/:id', component: DummyComponent } as never,
      'other-plugin',
    );

    expect(ctx.hasUnsavedWork('invoices/i-3')).toBe(false);
  });

  it('is told nothing about an address no plugin registered', () => {
    const { ctx } = makeContext();

    expect(ctx.hasUnsavedWork('nowhere')).toBe(false);
  });
});

describe('a picture of the workbench', () => {
  it('is offered nowhere in a plugin context, at any grant', () => {
    const { ctx } = makeContext(ALL);

    const reachable = [
      ...Object.keys(ctx),
      ...Object.getOwnPropertyNames(Object.getPrototypeOf(ctx)),
      ...Object.keys(ctx.ui),
      ...Object.keys(ctx.host),
      ...Object.keys(ctx.session),
    ];

    expect(
      reachable.filter((name) => /capture|picture|screenshot/i.test(name)),
    ).toEqual([]);
  });
});

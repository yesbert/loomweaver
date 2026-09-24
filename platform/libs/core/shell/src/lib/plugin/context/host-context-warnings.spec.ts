import { LayoutRegion } from '../../layout/layout';
import { ALL, DummyComponent, makeContext } from './host-context-harness';

describe('what the host warns a plugin author about', () => {
  describe('container arrangement guard (dev-mode)', () => {
    it('registers the surface but names every unusable part of the arrangement', () => {
      const { ctx, registry } = makeContext();
      const warn = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);

      ctx.registerSurface({
        id: 'runs.detail',
        title: 't',
        routable: { path: 'runs/:id' },
        container: {
          children: ['graph'],
          initial: {
            columns: [{ tabs: ['graph'] }, { size: -5, tabs: ['monitor'] }],
          },
        },
      });

      expect(registry.contentRoutes()).toHaveLength(1);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('not listed in children'),
      );
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('positive percentage'),
      );
      warn.mockRestore();
    });

    it('stays silent for an arrangement that holds up', () => {
      const { ctx } = makeContext();
      const warn = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);

      ctx.registerSurface({
        id: 'runs.detail',
        title: 't',
        routable: { path: 'runs/:id' },
        container: {
          children: ['graph', 'monitor'],
          initial: { columns: [{ tabs: ['graph'] }, { tabs: ['monitor'] }] },
        },
      });

      expect(warn).not.toHaveBeenCalled();
      warn.mockRestore();
    });
  });

  describe('home-dock region guard (dev-mode)', () => {
    it('warns when a non-routable surface docks into a non-panel region (silent no-op today)', () => {
      const { ctx, registry } = makeContext();
      const warn = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);

      ctx.registerSurface({
        id: 'answer',
        docks: ['main'],
        title: 't',
        component: DummyComponent,
      });

      expect(registry.views()).toHaveLength(1);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('"main"'));
      warn.mockRestore();
    });

    it('does not warn when the home dock is a panel region', () => {
      const { ctx } = makeContext();
      const warn = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);

      ctx.registerSurface({
        id: 'v',
        docks: ['primary'],
        title: 't',
        component: DummyComponent,
      });

      expect(warn).not.toHaveBeenCalled();
      warn.mockRestore();
    });

    it('registers a follows surface without a warning — it is the facet tab itself', () => {
      const { ctx, registry } = makeContext();
      const warn = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);

      ctx.registerSurface({
        id: 'pricing',
        title: 't',
        routable: { path: 'programs/:id/pricing', follows: true },
        component: DummyComponent,
      });

      expect(registry.contentRoutes()).toHaveLength(1);
      expect(warn).not.toHaveBeenCalled();
      warn.mockRestore();
    });

    it('does not warn for a docks:[] container-only child', () => {
      const { ctx, registry } = makeContext();
      const warn = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);

      ctx.registerSurface({
        id: 'child',
        docks: [],
        title: 't',
        component: DummyComponent,
      });

      expect(registry.views()).toHaveLength(1);
      expect(warn).not.toHaveBeenCalled();
      warn.mockRestore();
    });
  });

  it('tells the author when an opened command explains nothing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { ctx } = makeContext();

    ctx.registerCommand({
      id: 'mine.open',
      title: 't',
      callable: true,
      run: () => undefined,
    });

    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0][0]).toContain('no description');

    warn.mockClear();
    ctx.registerCommand({
      id: 'mine.described',
      title: 't',
      description: 'What it does',
      callable: true,
      run: () => undefined,
    });

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  describe('a kept surface with sub-routes', () => {
    it('is registered without a warning, since its route follows the sub-address', () => {
      const warn = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);
      const { ctx } = makeContext();

      ctx.registerSurface({
        id: 'x.view',
        title: 't',
        component: DummyComponent,
        retain: 'always',
        routable: { path: 'x', subRoutes: ['a', 'b'] },
      });

      expect(warn).not.toHaveBeenCalled();
      warn.mockRestore();
    });
  });

  describe('region warnings for bar and rail items', () => {
    const BARS: readonly LayoutRegion[] = [
      { id: 'status-bar', type: 'bar', dock: 'bottom' },
      { id: 'primary', type: 'rail', dock: 'left' },
    ];

    let warn: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    });

    afterEach(() => warn.mockRestore());

    it('says so when a bar item names a region that does not exist', () => {
      const { ctx } = makeContext(ALL, BARS);

      ctx.registerBarItem({
        id: 'x.count',
        bar: 'status',
        slot: 'start',
        component: DummyComponent,
      });

      expect(warn).toHaveBeenCalledOnce();
      expect(warn.mock.calls[0][0]).toContain("'status'");
      expect(warn.mock.calls[0][0]).toContain('does not declare');
    });

    it('says so when the region exists but is the wrong type', () => {
      const { ctx } = makeContext(ALL, BARS);

      ctx.registerBarItem({
        id: 'x.count',
        bar: 'primary',
        slot: 'start',
        component: DummyComponent,
      });

      expect(warn).toHaveBeenCalledOnce();
      expect(warn.mock.calls[0][0]).toContain("'rail' region");
    });

    it('stays quiet when the item lands where it can render', () => {
      const { ctx } = makeContext(ALL, BARS);

      ctx.registerBarItem({
        id: 'x.count',
        bar: 'status-bar',
        slot: 'start',
        component: DummyComponent,
      });
      ctx.registerRailItem({
        id: 'x.rail',
        rail: 'primary',
        icon: 'i',
        title: 't',
        run: () => undefined,
      });

      expect(warn).not.toHaveBeenCalled();
    });
  });
});

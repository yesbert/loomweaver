import { TestBed } from '@angular/core/testing';
import { SurfaceRevealService } from './surface-reveal.service';
import { CONTENT_DOCK } from '../pane/tree/pane-address';
import { PaneTreeService } from '../pane/tree/pane-tree.service';
import { ContentTabsService } from '../content/tabs/content-tabs.service';
import { PanelState } from '../panel/panel-state';
import { PanelGroupService } from '../panel/panel-group.service';
import { ViewportService } from '../../layout/viewport.service';
import { ContributionRegistry } from '../../contributions/contribution-registry';
import { SHELL_LAYOUT } from '../../layout/layout';
import { FeatureSwitches } from '../../features/feature-switches.service';
import { SurfaceCopyRecency } from './surface-copy-recency';
import { PaneRef } from '../pane/tree/pane-address';
import { PaneChromeService } from '../pane/chrome/pane-chrome.service';

describe('SurfaceRevealService', () => {
  afterEach(() => localStorage.clear());

  interface Options {
    readonly compact?: boolean;
    readonly declared?: Record<string, string>;
    readonly seededPaths?: Record<string, string[]>;
    readonly recent?: (copies: readonly PaneRef[]) => readonly PaneRef[];
    readonly minimized?: readonly string[];
    readonly maximized?: string;
  }

  function setup(dockTrees: Record<string, unknown>, options: Options = {}) {
    const setActiveTab = vi.fn();
    const activateViewTab = vi.fn();
    const expand = vi.fn();
    const openOverlay = vi.fn();
    const toggleMinimize = vi.fn();
    const endMaximize = vi.fn();
    const seed = vi.fn((region: string) => {
      dockTrees[region] = leafWith('main', options.seededPaths?.[region] ?? []);
    });
    TestBed.configureTestingModule({
      providers: [
        {
          provide: PaneTreeService,
          useValue: {
            dockTrees: () => dockTrees,
            setActiveTab,
            primaryId: () => 'main',
            carriesAddress: (pane: PaneRef) =>
              pane.dock === CONTENT_DOCK && pane.paneId === 'main',
          },
        },
        {
          provide: PaneChromeService,
          useValue: {
            isMinimized: (dock: string, paneId: string) =>
              options.minimized?.includes(`${dock}:${paneId}`) ?? false,
            maximizedPaneIn: (dock: string) =>
              dock === CONTENT_DOCK ? (options.maximized ?? null) : null,
            toggleMinimize,
            endMaximize,
          },
        },
        { provide: ContentTabsService, useValue: { activateViewTab } },
        {
          provide: SurfaceCopyRecency,
          useValue: {
            mostRecent: (_path: string, copies: readonly PaneRef[]) =>
              options.recent?.(copies) ?? copies,
          },
        },
        { provide: PanelState, useValue: { expand, openOverlay } },
        {
          provide: PanelGroupService,
          useValue: {
            seed,
            seededPaths: (region: string) =>
              options.seededPaths?.[region] ?? [],
          },
        },
        {
          provide: ViewportService,
          useValue: { compact: () => options.compact ?? false },
        },
        {
          provide: ContributionRegistry,
          useValue: {
            views: () =>
              Object.entries(options.declared ?? {}).map(([id, region]) => ({
                id,
                region,
              })),
          },
        },
        {
          provide: SHELL_LAYOUT,
          useValue: {
            regions: [
              { id: 'primary', type: 'panel', dock: 'left' },
              { id: 'main', type: 'content', dock: 'center' },
              { id: 'secondary', type: 'panel', dock: 'right' },
            ],
          },
        },
      ],
    });
    return {
      service: TestBed.inject(SurfaceRevealService),
      setActiveTab,
      activateViewTab,
      expand,
      openOverlay,
      seed,
      toggleMinimize,
      endMaximize,
    };
  }

  const leafWith = (id: string, paths: string[]) => ({
    kind: 'leaf',
    id,
    tabs: paths.map((path) => ({ path })),
  });

  const splitOf = (first: unknown, second: unknown) => ({
    kind: 'split',
    id: 'split',
    orientation: 'row',
    ratio: 0.5,
    first,
    second,
  });

  describe('a view standing in several places', () => {
    const library = 'view:testbed.library';

    it('brings forward the copy that was current most recently', () => {
      const { service, activateViewTab, setActiveTab, expand } = setup(
        {
          primary: leafWith('main', [library]),
          [CONTENT_DOCK]: leafWith('main', ['doc/a', library]),
        },
        {
          recent: (copies) =>
            copies.filter((copy) => copy.dock === CONTENT_DOCK),
        },
      );

      service.reveal('testbed.library');

      expect(activateViewTab).toHaveBeenCalledWith(library);
      expect(setActiveTab).not.toHaveBeenCalled();
      expect(expand).not.toHaveBeenCalled();
    });

    it('takes the sidebar copy when that one was current most recently', () => {
      const { service, activateViewTab, setActiveTab } = setup(
        {
          [CONTENT_DOCK]: leafWith('main', ['doc/a', library]),
          primary: leafWith('main', [library]),
        },
        {
          recent: (copies) => copies.filter((copy) => copy.dock === 'primary'),
        },
      );

      service.reveal('testbed.library');

      expect(setActiveTab).toHaveBeenCalledWith('primary', 'main', library);
      expect(activateViewTab).not.toHaveBeenCalled();
    });

    it('without history prefers the copy in the pane that carries the address', () => {
      const { service, activateViewTab, setActiveTab } = setup({
        primary: leafWith('main', [library]),
        [CONTENT_DOCK]: leafWith('main', ['doc/a', library]),
      });

      service.reveal('testbed.library');

      expect(activateViewTab).toHaveBeenCalledWith(library);
      expect(setActiveTab).not.toHaveBeenCalled();
    });

    it('without history and outside the address pane takes the first copy in reading order', () => {
      const { service, setActiveTab, activateViewTab } = setup({
        secondary: leafWith('main', [library]),
        [CONTENT_DOCK]: splitOf(
          leafWith('main', ['doc/a']),
          leafWith('aside', [library]),
        ),
        primary: leafWith('main', [library]),
      });

      service.reveal('testbed.library');

      expect(setActiveTab).toHaveBeenCalledTimes(1);
      expect(setActiveTab).toHaveBeenCalledWith('primary', 'main', library);
      expect(activateViewTab).not.toHaveBeenCalled();
    });

    it('restores the minimised pane the chosen copy stands in', () => {
      const { service, setActiveTab, toggleMinimize, endMaximize } = setup(
        {
          [CONTENT_DOCK]: splitOf(
            leafWith('main', ['doc/a']),
            leafWith('aside', [library]),
          ),
        },
        { minimized: [`${CONTENT_DOCK}:aside`] },
      );

      service.reveal('testbed.library');

      expect(setActiveTab).toHaveBeenCalledWith(CONTENT_DOCK, 'aside', library);
      expect(toggleMinimize).toHaveBeenCalledWith(CONTENT_DOCK, 'aside');
      expect(endMaximize).not.toHaveBeenCalled();
    });

    it('ends the maximise of another pane, and keeps that of its own', () => {
      const tree = {
        [CONTENT_DOCK]: splitOf(
          leafWith('main', ['doc/a']),
          leafWith('aside', [library]),
        ),
      };
      const other = setup(tree, { maximized: 'main' });
      other.service.reveal('testbed.library');
      expect(other.endMaximize).toHaveBeenCalledTimes(1);
      expect(other.toggleMinimize).not.toHaveBeenCalled();

      TestBed.resetTestingModule();
      const own = setup(tree, { maximized: 'aside' });
      own.service.reveal('testbed.library');
      expect(own.endMaximize).not.toHaveBeenCalled();
    });

    it('reads the content area before a sidebar on the right', () => {
      const { service, setActiveTab } = setup({
        secondary: leafWith('main', [library]),
        [CONTENT_DOCK]: splitOf(
          leafWith('main', ['doc/a']),
          leafWith('aside', [library]),
        ),
      });

      service.reveal('testbed.library');

      expect(setActiveTab).toHaveBeenCalledWith(CONTENT_DOCK, 'aside', library);
    });
  });

  it('activates the view tab in its sidebar pane and expands that panel', () => {
    const { service, setActiveTab, expand } = setup({
      primary: leafWith('main', [
        'view:testbed.library',
        'view:testbed.outline',
      ]),
    });

    service.reveal('testbed.library');

    expect(setActiveTab).toHaveBeenCalledWith(
      'primary',
      'main',
      'view:testbed.library',
    );
    expect(expand).toHaveBeenCalledWith('primary');
  });

  it('expands the panel a plugin brings a surface forward in although collapsing is switched off', () => {
    const { service, expand } = setup({
      primary: leafWith('main', ['view:testbed.library']),
    });
    TestBed.inject(FeatureSwitches).update({ sidebar: { collapse: false } });

    service.reveal('testbed.library');

    expect(expand).toHaveBeenCalledWith('primary');
  });

  it('activates a view living as a tab of the URL group without touching panels', () => {
    const { service, activateViewTab, setActiveTab, expand } = setup({
      [CONTENT_DOCK]: leafWith('main', ['doc/a', 'view:testbed.library']),
    });

    service.reveal('testbed.library');

    expect(activateViewTab).toHaveBeenCalledWith('view:testbed.library');
    expect(setActiveTab).not.toHaveBeenCalled();
    expect(expand).not.toHaveBeenCalled();
  });

  it('is a no-op for an unknown id and skips sealed container docks', () => {
    const { service, setActiveTab, activateViewTab, expand } = setup({
      'container@workspace/alpha': leafWith('main', ['view:testbed.wsCanvas']),
    });

    service.reveal('testbed.wsCanvas');
    service.reveal('testbed.unknown');

    expect(setActiveTab).not.toHaveBeenCalled();
    expect(activateViewTab).not.toHaveBeenCalled();
    expect(expand).not.toHaveBeenCalled();
  });

  it('leaves the overlay alone on a wide window', () => {
    const { service, openOverlay } = setup({
      primary: leafWith('main', ['view:testbed.library']),
    });

    service.reveal('testbed.library');

    expect(openOverlay).not.toHaveBeenCalled();
  });

  it('opens the panel’s overlay on a narrow window, and still expands it for later', () => {
    const { service, openOverlay, expand, setActiveTab } = setup(
      { primary: leafWith('main', ['view:testbed.library']) },
      { compact: true },
    );

    service.reveal('testbed.library');

    expect(setActiveTab).toHaveBeenCalledWith(
      'primary',
      'main',
      'view:testbed.library',
    );
    expect(openOverlay).toHaveBeenCalledWith('primary');
    expect(expand).toHaveBeenCalledWith('primary');
  });

  it('finds a view in a panel never drawn by seeding the panel it is declared for', () => {
    const { service, seed, setActiveTab, openOverlay } = setup(
      {},
      {
        compact: true,
        declared: { 'testbed.library': 'primary' },
        seededPaths: { primary: ['view:testbed.nav', 'view:testbed.library'] },
      },
    );

    service.reveal('testbed.library');

    expect(seed).toHaveBeenCalledWith('primary');
    expect(setActiveTab).toHaveBeenCalledWith(
      'primary',
      'main',
      'view:testbed.library',
    );
    expect(openOverlay).toHaveBeenCalledWith('primary');
  });

  it('leaves a hidden view alone, and does not seed for it', () => {
    const { service, seed, setActiveTab, openOverlay } = setup(
      {},
      {
        compact: true,
        declared: { 'testbed.library': 'primary' },
        seededPaths: { primary: ['view:testbed.nav'] },
      },
    );

    service.reveal('testbed.library');

    expect(seed).not.toHaveBeenCalled();
    expect(setActiveTab).not.toHaveBeenCalled();
    expect(openOverlay).not.toHaveBeenCalled();
  });

  it('does not seed a region that is not a side panel', () => {
    const { service, seed } = setup(
      {},
      {
        declared: { 'testbed.page': 'main' },
        seededPaths: { main: ['view:testbed.page'] },
      },
    );

    service.reveal('testbed.page');

    expect(seed).not.toHaveBeenCalled();
  });
});

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

describe('SurfaceRevealService', () => {
  afterEach(() => localStorage.clear());

  interface Options {
    readonly compact?: boolean;
    readonly declared?: Record<string, string>;
    readonly seededPaths?: Record<string, string[]>;
  }

  function setup(dockTrees: Record<string, unknown>, options: Options = {}) {
    const setActiveTab = vi.fn();
    const activateViewTab = vi.fn();
    const expand = vi.fn();
    const openOverlay = vi.fn();
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
          },
        },
        { provide: ContentTabsService, useValue: { activateViewTab } },
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
    };
  }

  const leafWith = (id: string, paths: string[]) => ({
    kind: 'leaf',
    id,
    tabs: paths.map((path) => ({ path })),
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

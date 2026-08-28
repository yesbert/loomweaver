import { TestBed } from '@angular/core/testing';
import { SurfaceRevealService } from './surface-reveal.service';
import { CONTENT_DOCK } from '../regions/pane/tree/pane-address';
import { PaneTreeService } from '../regions/pane/tree/pane-tree.service';
import { ContentTabsService } from '../regions/content/tabs/content-tabs.service';
import { PanelState } from '../regions/panel/panel-state';

describe('SurfaceRevealService (finding #29)', () => {
  afterEach(() => localStorage.clear());

  function setup(dockTrees: Record<string, unknown>) {
    const setActiveTab = vi.fn();
    const activateViewTab = vi.fn();
    const expand = vi.fn();
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
        { provide: PanelState, useValue: { expand } },
      ],
    });
    return {
      service: TestBed.inject(SurfaceRevealService),
      setActiveTab,
      activateViewTab,
      expand,
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
});

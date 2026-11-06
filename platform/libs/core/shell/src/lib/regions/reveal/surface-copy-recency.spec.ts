import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SurfaceCopyRecency } from './surface-copy-recency';
import { CONTENT_DOCK, PaneRef } from '../pane/tree/pane-address';
import { PaneTreeService } from '../pane/tree/pane-tree.service';
import { ContentTabsService } from '../content/tabs/content-tabs.service';
import { PaneChromeService } from '../pane/chrome/pane-chrome.service';

const LIBRARY = 'view:testbed.library';
const OUTLINE = 'view:testbed.outline';
const SIDEBAR: PaneRef = { dock: 'primary', paneId: 'main' };
const ADDRESS: PaneRef = { dock: CONTENT_DOCK, paneId: 'main' };
const COPIES = [SIDEBAR, ADDRESS];

describe('SurfaceCopyRecency', () => {
  function setup(sidebarActive: string, addressView: string | null) {
    const sidebar = signal(sidebarActive);
    const address = signal(addressView);
    const contentTabs = signal([{ path: 'doc/a' }, { path: LIBRARY }]);
    const minimized = signal<readonly string[]>([]);
    const arrangement = signal(0);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: PaneTreeService,
          useValue: {
            dockTrees: () => ({
              primary: {
                kind: 'leaf',
                id: 'main',
                tabs: [{ path: LIBRARY }, { path: OUTLINE }],
                active: sidebar(),
              },
              [CONTENT_DOCK]: {
                kind: 'leaf',
                id: 'main',
                tabs: contentTabs(),
              },
              'container@workspace/alpha': {
                kind: 'leaf',
                id: 'main',
                tabs: [{ path: LIBRARY }],
              },
            }),
            carriesAddress: (pane: PaneRef) =>
              pane.dock === CONTENT_DOCK && pane.paneId === 'main',
            arrangement: arrangement.asReadonly(),
          },
        },
        {
          provide: PaneChromeService,
          useValue: {
            isMinimized: (dock: string, paneId: string) =>
              minimized().includes(`${dock}:${paneId}`),
          },
        },
        {
          provide: ContentTabsService,
          useValue: { activeViewPath: address.asReadonly() },
        },
      ],
    });
    const recency = TestBed.inject(SurfaceCopyRecency);
    recency.start();
    TestBed.tick();
    const step = (change: () => void) => {
      change();
      TestBed.tick();
    };
    return {
      recency,
      sidebar,
      address,
      contentTabs,
      minimized,
      arrangement,
      step,
    };
  }

  it('names every copy when none was ever current', () => {
    const { recency } = setup(OUTLINE, null);

    expect(recency.mostRecent(LIBRARY, COPIES)).toEqual(COPIES);
  });

  it('prefers the copy that became current later when both are current', () => {
    const { recency, address, step } = setup(LIBRARY, null);

    step(() => address.set(LIBRARY));

    expect(recency.mostRecent(LIBRARY, COPIES)).toEqual([ADDRESS]);
  });

  it('prefers a copy that is still current over one current later and left since', () => {
    const { recency, address, step } = setup(LIBRARY, null);

    step(() => address.set(LIBRARY));
    step(() => address.set(null));

    expect(recency.mostRecent(LIBRARY, COPIES)).toEqual([SIDEBAR]);
  });

  it('among copies that were left, prefers the one left later', () => {
    const { recency, sidebar, address, step } = setup(LIBRARY, null);

    step(() => address.set(LIBRARY));
    step(() => sidebar.set(OUTLINE));
    step(() => address.set(null));

    expect(recency.mostRecent(LIBRARY, COPIES)).toEqual([ADDRESS]);
  });

  it('sees a change made just before it is asked', () => {
    const { recency, sidebar, address } = setup(LIBRARY, null);

    address.set(LIBRARY);
    sidebar.set(OUTLINE);

    expect(recency.mostRecent(LIBRARY, COPIES)).toEqual([ADDRESS]);
  });

  it('ties copies that were current from the start', () => {
    const { recency } = setup(LIBRARY, LIBRARY);

    expect(recency.mostRecent(LIBRARY, COPIES)).toEqual(COPIES);
  });

  it('does not count a copy in a minimised pane as current', () => {
    const { recency, address, minimized, step } = setup(LIBRARY, null);

    step(() => address.set(LIBRARY));
    step(() => minimized.set([`${CONTENT_DOCK}:main`]));

    expect(recency.mostRecent(LIBRARY, COPIES)).toEqual([SIDEBAR]);
  });

  it('forgets a copy once it is closed, so a copy opened again starts without history', () => {
    const { recency, address, contentTabs, step } = setup(OUTLINE, LIBRARY);

    step(() => address.set(null));
    step(() => contentTabs.set([{ path: 'doc/a' }]));
    step(() => contentTabs.set([{ path: 'doc/a' }, { path: LIBRARY }]));

    expect(recency.mostRecent(LIBRARY, COPIES)).toEqual(COPIES);
  });

  it('forgets every copy when the arrangement is replaced, as on a workspace switch', () => {
    const { recency, address, arrangement, step } = setup(OUTLINE, LIBRARY);

    step(() => address.set(null));
    step(() => arrangement.set(1));

    expect(recency.mostRecent(LIBRARY, COPIES)).toEqual(COPIES);
  });
});

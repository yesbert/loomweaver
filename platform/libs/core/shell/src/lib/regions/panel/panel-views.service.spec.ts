import { WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ANONYMOUS, AuthSnapshot } from '@loomweaver/plugin-sdk';
import { PanelViewsService } from './panel-views.service';
import { UserOrderService } from '../reorder/user-order.service';
import { PRIMARY_PANE } from '../pane/tree/pane-address';
import { CONTENT_DOCK } from '../pane/tree/pane-address';
import { PaneTreeService } from '../pane/tree/pane-tree.service';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { AUTH_SOURCE } from '../../auth/auth-context';
import { provideLayout } from '../../layout/layout';
import { CONTAINER_CHILD_REGION } from '../../plugin/surface-normalize';
import { View } from '../../layout/view';

const view = (id: string, region: string, order = 0): View => ({
  id,
  region,
  title: id,
  order,
});

describe('PanelViewsService', () => {
  let svc: PanelViewsService;
  let registry: ContributionRegistry;

  function seedViews(): void {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(PanelViewsService);
    registry = TestBed.inject(ContributionRegistry);
    registry.addView(view('lib', 'primary', 0));
    registry.addView(view('outline', 'primary', 1));
    registry.addView(view('info', 'secondary', 0));
  }

  beforeEach(() => {
    localStorage.clear();
    seedViews();
  });

  const ids = (region: string) => svc.viewsInRegion(region).map((v) => v.id);

  it('filters by declared region and sorts by order', () => {
    expect(ids('primary')).toEqual(['lib', 'outline']);
    expect(ids('secondary')).toEqual(['info']);
  });

  it('applies the user order overlay within a region', () => {
    TestBed.inject(UserOrderService).setOrder('panel-views:primary', [
      'outline',
      'lib',
    ]);
    expect(ids('primary')).toEqual(['outline', 'lib']);
  });

  it('applies the user order overlay in the other region too', () => {
    TestBed.inject(UserOrderService).setOrder('panel-views:secondary', [
      'info',
    ]);
    expect(ids('secondary')).toEqual(['info']);
  });
});

describe('PanelViewsService candidates (curating one sidebar)', () => {
  const twoPanels = provideLayout({
    regions: [
      { id: 'primary', type: 'panel', dock: 'left' },
      { id: 'secondary', type: 'panel', dock: 'right' },
      { id: 'main', type: 'content', dock: 'center' },
    ],
  });

  function setup() {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [twoPanels] });
    const svc = TestBed.inject(PanelViewsService);
    const registry = TestBed.inject(ContributionRegistry);
    registry.addView(view('lib', 'primary', 0));
    registry.addView(view('outline', 'primary', 1));
    registry.addView(view('info', 'secondary', 0));
    return { svc, paneTree: TestBed.inject(PaneTreeService) };
  }

  const entries = (svc: PanelViewsService, region: string) =>
    svc.candidatesFor(region).map((c) => `${c.view.id}:${c.here}`);

  it('lists what sits here, and what sits in no sidebar at all', () => {
    const { svc, paneTree } = setup();
    paneTree.insertTab('primary', PRIMARY_PANE, 'view:lib');
    paneTree.insertTab('secondary', PRIMARY_PANE, 'view:info');

    expect(entries(svc, 'primary')).toEqual(['lib:true', 'outline:false']);
    expect(entries(svc, 'secondary')).toEqual(['info:true', 'outline:false']);
  });

  it('follows the tab rather than the declared region', () => {
    const { svc, paneTree } = setup();
    paneTree.insertTab('secondary', PRIMARY_PANE, 'view:outline');
    paneTree.insertTab('secondary', PRIMARY_PANE, 'view:info');
    paneTree.insertTab('primary', PRIMARY_PANE, 'view:lib');

    expect(entries(svc, 'primary')).toEqual(['lib:true']);
    expect(entries(svc, 'secondary')).toEqual(['info:true', 'outline:true']);
  });

  it('offers a view that escaped into the content area on both sides', () => {
    const { svc, paneTree } = setup();
    paneTree.insertTab('primary', PRIMARY_PANE, 'view:lib');
    paneTree.insertTab('secondary', PRIMARY_PANE, 'view:info');
    paneTree.insertTab(CONTENT_DOCK, PRIMARY_PANE, 'view:outline');

    expect(entries(svc, 'primary')).toEqual(['lib:true', 'outline:false']);
    expect(entries(svc, 'secondary')).toEqual(['info:true', 'outline:false']);
  });

  it('leaves a container child out of every sidebar list', () => {
    const { svc, paneTree } = setup();
    TestBed.inject(ContributionRegistry).addView(
      view('child', CONTAINER_CHILD_REGION, 0),
    );
    paneTree.insertTab('primary', PRIMARY_PANE, 'view:lib');
    paneTree.insertTab('secondary', PRIMARY_PANE, 'view:info');

    expect(entries(svc, 'primary')).toEqual(['lib:true', 'outline:false']);
  });
});

describe('PanelViewsService auth gating', () => {
  const gated = (id: string, region: string, access: View['access']): View => ({
    id,
    region,
    title: id,
    access,
  });

  function setup(auth: WritableSignal<AuthSnapshot>) {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        { provide: AUTH_SOURCE, useValue: auth },
        provideLayout({
          regions: [
            { id: 'primary', type: 'panel', dock: 'left' },
            { id: 'secondary', type: 'panel', dock: 'right' },
            { id: 'main', type: 'content', dock: 'center' },
          ],
        }),
      ],
    });
    const svc = TestBed.inject(PanelViewsService);
    const registry = TestBed.inject(ContributionRegistry);
    registry.addView(view('info', 'secondary', 0));
    registry.addView(gated('admin', 'secondary', { anyRole: ['admin'] }));
    return { svc };
  }

  it('lists a gated view among the declared views regardless of the session (TreeWeaver #40)', () => {
    const auth = signal<AuthSnapshot>(ANONYMOUS);
    const { svc } = setup(auth);

    expect(svc.viewsInRegion('secondary').map((v) => v.id)).toEqual([
      'info',
      'admin',
    ]);
  });

  it('offers a gated view for curation only once the session qualifies', () => {
    const auth = signal<AuthSnapshot>(ANONYMOUS);
    const { svc } = setup(auth);
    expect(svc.candidatesFor('secondary').map((c) => c.view.id)).toEqual([
      'info',
    ]);

    auth.set({ authenticated: true, roles: ['admin'], claims: {} });
    expect(svc.candidatesFor('secondary').map((c) => c.view.id)).toEqual([
      'info',
      'admin',
    ]);
  });
});

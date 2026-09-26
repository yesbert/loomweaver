import { WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ANONYMOUS, AuthSnapshot } from '@loomweaver/plugin-sdk';
import { PanelViewsService } from './panel-views.service';
import { UserOrderService } from '../reorder/user-order.service';
import { ContributionRegistry } from '../../contributions/contribution-registry';
import { AUTH_SOURCE } from '../../auth/auth-context';
import { provideLayout } from '../../layout/layout';
import { View } from '../../views/view';

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

  it('lists a gated view among the declared views regardless of the session', () => {
    const auth = signal<AuthSnapshot>(ANONYMOUS);
    const { svc } = setup(auth);

    expect(svc.viewsInRegion('secondary').map((v) => v.id)).toEqual([
      'info',
      'admin',
    ]);
  });
});

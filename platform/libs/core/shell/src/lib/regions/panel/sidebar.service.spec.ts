import { Component, computed } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { FeatureSwitches } from '../../features/feature-switches.service';
import { provideLayout } from '../../layout/layout';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { SurfaceCloseGuard } from '../pane/close/surface-close-guard';
import {
  MAX_PANEL_WIDTH,
  MIN_PANEL_WIDTH,
  PanelSizeService,
} from './panel-size.service';
import { PanelState } from './panel-state';
import { SidebarService } from './sidebar.service';

@Component({ selector: 'lw-sidebar-stub', template: '' })
class Stub {}

class CapturingCloseGuard {
  readonly captured: unknown[][] = [];
  proceed = true;

  guarded(candidates: readonly unknown[], run: () => void): void {
    this.captured.push([...candidates]);
    if (this.proceed) {
      run();
    }
  }
}

function setUp() {
  localStorage.clear();
  const guard = new CapturingCloseGuard();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideLayout({
        regions: [
          { id: 'primary', type: 'panel', dock: 'left' },
          { id: 'main', type: 'content', dock: 'center' },
          { id: 'secondary', type: 'panel', dock: 'right' },
        ],
      }),
      { provide: SurfaceCloseGuard, useValue: guard },
      {
        provide: TranslocoService,
        useValue: { translate: (key: string) => key },
      },
    ],
  });
  TestBed.inject(ContributionRegistry).addView({
    id: 'outline',
    region: 'primary',
    title: 'outline',
    icon: 'outline',
    order: 0,
    component: Stub,
  });
  return {
    sidebars: TestBed.inject(SidebarService),
    panels: TestBed.inject(PanelState),
    sizes: TestBed.inject(PanelSizeService),
    guard,
  };
}

describe('SidebarService facts', () => {
  it('lists the declared panels with their state, in layout order', () => {
    const { sidebars } = setUp();

    expect(sidebars.regions().map((region) => region.regionId)).toEqual([
      'primary',
      'secondary',
    ]);
    expect(sidebars.regions()[0]).toMatchObject({
      collapsed: false,
      width: sidebars.width('primary'),
    });
  });

  it('follows a collapse made from the header, and a computed re-evaluates', () => {
    const { sidebars, panels } = setUp();
    const collapsed = computed(() => sidebars.isCollapsed('primary'));
    expect(collapsed()).toBe(false);

    panels.toggle('primary');

    expect(collapsed()).toBe(true);
    expect(sidebars.regions()[0].collapsed).toBe(true);
  });

  it('follows a width set through the size service', () => {
    const { sidebars, sizes } = setUp();

    sizes.setWidth('secondary', 300);

    expect(sidebars.width('secondary')).toBe(300);
    expect(sidebars.regions()[1].width).toBe(300);
  });
});

describe('SidebarService actions', () => {
  it('collapse, expand and toggle act like the header', () => {
    const { sidebars, panels } = setUp();

    sidebars.collapse('primary');
    sidebars.collapse('primary');
    expect(panels.isCollapsed('primary')).toBe(true);

    sidebars.expand('primary');
    expect(panels.isCollapsed('primary')).toBe(false);

    sidebars.toggle('primary');
    expect(panels.isCollapsed('primary')).toBe(true);
    expect(JSON.parse(localStorage.getItem('lw.shell.panels') ?? '{}')).toEqual(
      { primary: true },
    );
  });

  it('a width set from code is clamped and remembered', () => {
    const { sidebars } = setUp();

    sidebars.setWidth('primary', 10_000);
    expect(sidebars.width('primary')).toBe(MAX_PANEL_WIDTH);

    sidebars.setWidth('primary', 1);
    expect(sidebars.width('primary')).toBe(MIN_PANEL_WIDTH);
    expect(localStorage.getItem('lw.shell.panel-sizes')).toContain(
      `"primary":${MIN_PANEL_WIDTH}`,
    );
  });

  it('an unknown region does nothing', () => {
    const { sidebars, panels } = setUp();
    const before = JSON.stringify(sidebars.regions());

    sidebars.collapse('nowhere');
    sidebars.toggle('nowhere');
    sidebars.setWidth('nowhere', 300);
    sidebars.showView('outline', 'nowhere');

    expect(JSON.stringify(sidebars.regions())).toBe(before);
    expect(panels.isCollapsed('nowhere')).toBe(false);
    expect(localStorage.getItem('lw.shell.panels')).toBeNull();
  });

  it('hiding a view asks the guard and the hidden views follow; showing brings it back', () => {
    const { sidebars, guard } = setUp();
    expect(sidebars.hiddenViews()).toEqual([]);

    sidebars.hideView('outline');

    expect(guard.captured).toHaveLength(1);
    expect(sidebars.hiddenViews()).toEqual(['outline']);

    sidebars.showView('outline');

    expect(sidebars.hiddenViews()).toEqual([]);
  });

  it('a refused guard leaves the view visible', () => {
    const { sidebars, guard } = setUp();
    guard.proceed = false;

    sidebars.hideView('outline');

    expect(sidebars.hiddenViews()).toEqual([]);
  });
});

describe('SidebarService and the rules of the surface', () => {
  it('stays reachable while the sidebar capabilities are switched off', () => {
    const { sidebars, panels } = setUp();
    TestBed.inject(FeatureSwitches).update({
      sidebar: { collapse: false, hideViews: false, resize: false },
    });

    sidebars.collapse('primary');
    sidebars.setWidth('secondary', 400);
    sidebars.hideView('outline');

    expect(panels.isCollapsed('primary')).toBe(true);
    expect(sidebars.width('secondary')).toBe(400);
    expect(sidebars.hiddenViews()).toEqual(['outline']);
  });
});

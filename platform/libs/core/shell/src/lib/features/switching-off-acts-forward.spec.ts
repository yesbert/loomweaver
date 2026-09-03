import { DOCUMENT } from '@angular/common';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { TranslocoService, TranslocoTestingModule } from '@jsverse/transloco';
import { ContentRoute } from '@loomweaver/plugin-sdk';
import { DialogService } from '../dialog/dialog.service';
import { provideShellFeatures } from '../foundation/shell-features';
import { provideLayout } from '../layout/layout';
import { View } from '../layout/view';
import { ContributionRegistry } from '../plugin/contribution-registry';
import { PopoutService } from '../popout/popout.service';
import { buildContentRoutes } from '../regions/content/routing/content-router';
import { ContentTabsService } from '../regions/content/tabs/content-tabs.service';
import { SurfaceCloseGuard } from '../regions/pane/close/surface-close-guard';
import {
  CONTENT_DOCK,
  PRIMARY_PANE,
} from '../regions/pane/tree/pane-address';
import { PaneTreeService } from '../regions/pane/tree/pane-tree.service';
import { PanelGroupService } from '../regions/panel/panel-group.service';
import { PanelState } from '../regions/panel/panel-state';
import { ShellSidebarHeader } from '../regions/panel/shell-sidebar-header';
import { FeatureSwitches } from './feature-switches.service';

@Component({ selector: 'lw-stub', template: '' })
class Stub {}

const ROUTES: readonly ContentRoute[] = [
  { path: '', component: Stub },
  { path: 'doc/:id', component: Stub, id: 'testbed.doc' },
];

const navView: View = {
  id: 'nav',
  region: 'primary',
  title: 'nav',
  icon: 'navigator',
  order: 0,
  component: Stub,
};

class CapturingCloseGuard {
  readonly captured: unknown[][] = [];

  guarded(candidates: readonly unknown[], run: () => void): void {
    this.captured.push([...candidates]);
    run();
  }
}

function renderSidebarHeader() {
  TestBed.configureTestingModule({
    imports: [
      ShellSidebarHeader,
      TranslocoTestingModule.forRoot({
        langs: {
          en: { nav: 'Nav', panel: { collapse: 'Collapse', expand: 'Expand' } },
        },
        translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
        preloadLangs: true,
      }),
    ],
    providers: [
      provideRouter([]),
      provideLayout({
        regions: [
          { id: 'primary', type: 'panel', dock: 'left' },
          { id: 'main', type: 'content', dock: 'center' },
        ],
      }),
    ],
  });
  TestBed.inject(ContributionRegistry).addView(navView);
  TestBed.inject(PanelGroupService).seed('primary');
  const fixture = TestBed.createComponent(ShellSidebarHeader);
  fixture.componentRef.setInput('region', {
    id: 'primary',
    type: 'panel',
    dock: 'left',
  });
  fixture.detectChanges();
  return fixture;
}

describe('Switching off acts forward, not backward', () => {
  beforeEach(() => localStorage.clear());

  it('a split pane stays split when splitting is switched off', () => {
    const paneTree = TestBed.inject(PaneTreeService);
    const switches = TestBed.inject(FeatureSwitches);
    paneTree.splitPane(CONTENT_DOCK, PRIMARY_PANE, 'row', 'search');
    expect(paneTree.isSplit(CONTENT_DOCK)).toBe(true);

    switches.update({ content: { splitRight: false, splitDown: false } });

    expect(paneTree.isSplit(CONTENT_DOCK)).toBe(true);
    expect(switches.content.splitRight()).toBe(false);
  });

  it('a collapsed sidebar stays collapsed, and the header stops offering the control', () => {
    const fixture = renderSidebarHeader();
    const panels = TestBed.inject(PanelState);
    expect(
      fixture.nativeElement.querySelector('[aria-label="Collapse"]'),
    ).not.toBeNull();

    TestBed.inject(FeatureSwitches).update({ sidebar: { collapse: false } });
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[aria-label="Collapse"]'),
    ).toBeNull();

    panels.toggle('primary');
    expect(panels.isCollapsed('primary')).toBe(true);
    TestBed.inject(FeatureSwitches).update({ sidebar: { collapse: true } });
    TestBed.inject(FeatureSwitches).update({ sidebar: { collapse: false } });
    expect(panels.isCollapsed('primary')).toBe(true);
  });
});

describe('A switched-off capability stays reachable to the distribution', () => {
  beforeEach(() => localStorage.clear());

  it('closing through the service works with content.close off, and still asks the guard', async () => {
    const guard = new CapturingCloseGuard();
    TestBed.configureTestingModule({
      providers: [
        provideRouter(buildContentRoutes(ROUTES)),
        { provide: SurfaceCloseGuard, useValue: guard },
      ],
    });
    const registry = TestBed.inject(ContributionRegistry);
    for (const route of ROUTES) {
      registry.addContentRoute(route);
    }
    const tabs = TestBed.inject(ContentTabsService);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/');
    tabs.open({ path: 'doc/a', title: 'a', titleIsLiteral: true });
    tabs.open({ path: 'doc/b', title: 'b', titleIsLiteral: true });

    TestBed.inject(FeatureSwitches).update({ content: { close: false } });
    tabs.close('doc/a');

    const open = tabs.tabs().map((tab) => tab.path);
    expect(open).not.toContain('doc/a');
    expect(open).toContain('doc/b');
    expect(guard.captured).toHaveLength(1);
  });

  it('a pop-out opens with windows.popout off', () => {
    const opened: unknown[] = [];
    TestBed.configureTestingModule({
      providers: [
        {
          provide: DOCUMENT,
          useValue: {
            location: { pathname: '/' },
            defaultView: {
              open: (...args: unknown[]) => {
                opened.push(args);
                return {};
              },
            },
          },
        },
        { provide: DialogService, useValue: { confirm: vi.fn() } },
        {
          provide: TranslocoService,
          useValue: { translate: (key: string) => key },
        },
      ],
    });
    TestBed.inject(FeatureSwitches).update({ windows: { popout: false } });

    TestBed.inject(PopoutService).open('view:testbed.outline');

    expect(opened).toEqual([['/popout/view/testbed.outline', '_blank']]);
  });
});

describe('The workbench does not remember a switch', () => {
  it('the next start reads the declaration, not the change', () => {
    TestBed.configureTestingModule({
      providers: [provideShellFeatures({ content: { splitRight: false } })],
    });
    TestBed.inject(FeatureSwitches).update({ content: { splitRight: true } });
    expect(TestBed.inject(FeatureSwitches).content.splitRight()).toBe(true);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideShellFeatures({ content: { splitRight: false } })],
    });

    expect(TestBed.inject(FeatureSwitches).content.splitRight()).toBe(false);
  });
});

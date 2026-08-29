import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ContentRoute } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { CONTENT_DOCK } from '../../pane/tree/pane-address';
import { PaneTreeService } from '../../pane/tree/pane-tree.service';
import { PRIMARY_PANE } from '../../pane/tree/pane-address';
import { RetainedViewStash } from '../../pane/retention/retained-view-stash';
import { SurfaceCloseGuard } from '../../pane/close/surface-close-guard';
import { buildContentRoutes } from '../routing/content-router';
import { ContentTabsService } from './content-tabs.service';

@Component({ selector: 'lw-test-content', template: '' })
class TestContent {}

const ROUTES: readonly ContentRoute[] = [
  { path: '', component: TestContent },
  { path: 'doc/:id', component: TestContent, id: 'testbed.doc' },
  { path: 'dashboard/overview', component: TestContent, title: 'k.dash' },
  { path: 'reports', component: TestContent, title: 'k.reports' },
  { path: 'note/:id', component: TestContent, subRoutes: ['preview'] },
];

class CapturingCloseGuard {
  captured: unknown[][] = [];
  proceed = true;

  guarded(candidates: readonly unknown[], run: () => void): void {
    this.captured.push([...candidates]);
    if (this.proceed) {
      run();
    }
  }
}

describe('TabClosingService close others/all/right', () => {
  let service: ContentTabsService;
  let harness: RouterTestingHarness;

  const open = (id: string) =>
    service.open({ path: `doc/${id}`, title: id, titleIsLiteral: true });
  const dynPaths = () =>
    service
      .tabs()
      .filter((t) => t.closable)
      .map((t) => t.path);

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter(buildContentRoutes(ROUTES))],
    });
    const registry = TestBed.inject(ContributionRegistry);
    for (const route of ROUTES) registry.addContentRoute(route);
    service = TestBed.inject(ContentTabsService);
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/');
    open('a');
    open('b');
    open('c');
  });

  it('closeOthers keeps the target and pinned tabs, closes the rest', () => {
    service.pin('doc/c');
    service.closeOthers('doc/a');
    expect(dynPaths()).toEqual(['doc/c', 'doc/a']);
  });

  it('closeAll keeps only pinned tabs', () => {
    service.pin('doc/b');
    service.closeAll();
    expect(dynPaths()).toEqual(['doc/b']);
  });

  it('closeToRight closes the tabs after the target', () => {
    service.closeToRight('doc/a');
    expect(dynPaths()).toEqual(['doc/a']);
  });

  it('closeToRight keeps a pinned tab (it sorts to the front, no longer "to the right")', () => {
    service.pin('doc/c');
    service.closeToRight('doc/a');
    expect(dynPaths()).toEqual(['doc/c', 'doc/a']);
  });

  it('closeAll and closeOthers spare a workspace-declared unclosable tab', () => {
    const paneTree = TestBed.inject(PaneTreeService);
    paneTree.setPrimaryTabs(
      CONTENT_DOCK,
      paneTree
        .primaryTabs(CONTENT_DOCK)
        .map((tab) =>
          tab.path === 'doc/a' ? { ...tab, closable: false } : tab,
        ),
    );

    service.closeOthers('doc/b');
    let paths = service.tabs().map((tab) => tab.path);
    expect(paths).toContain('doc/a');
    expect(paths).not.toContain('doc/c');

    service.closeAll();
    paths = service.tabs().map((tab) => tab.path);
    expect(paths).toContain('doc/a');
    expect(paths).not.toContain('doc/b');
    const unclosable = service.tabs().find((tab) => tab.path === 'doc/a');
    expect(unclosable?.closable).toBe(false);
  });
});

describe('TabClosingService close guarding', () => {
  const dirtyChild = {
    surfaceDirty: () => true,
  };

  async function setup() {
    localStorage.clear();
    const guard = new CapturingCloseGuard();
    TestBed.configureTestingModule({
      providers: [
        provideRouter(buildContentRoutes(ROUTES)),
        { provide: SurfaceCloseGuard, useValue: guard },
        {
          provide: RetainedViewStash,
          useValue: {
            instancesFor: () => [],
            evacuate: () => undefined,
            keyedInstances: () => [
              { key: 'container@doc/a:c1|canvas', instance: dirtyChild },
            ],
          },
        },
      ],
    });
    const registry = TestBed.inject(ContributionRegistry);
    for (const route of ROUTES) registry.addContentRoute(route);
    const service = TestBed.inject(ContentTabsService);
    const harness = await RouterTestingHarness.create();
    return { guard, service, harness };
  }

  it('close() hands a dirty container child to the close guard', async () => {
    const { guard, service, harness } = await setup();
    await harness.navigateByUrl('/doc/a');
    guard.proceed = false;

    service.close('doc/a');

    expect(guard.captured.at(-1)).toContain(dirtyChild);
    expect(service.tabs().some((tab) => tab.path === 'doc/a')).toBe(true);
  });

  it('closePrimaryPane collapses the split only when the guard proceeds', async () => {
    const { guard, service, harness } = await setup();
    await harness.navigateByUrl('/doc/a');
    const paneTree = TestBed.inject(PaneTreeService);
    paneTree.splitPane('content', PRIMARY_PANE, 'row', 'doc/b');
    expect(paneTree.isSplit('content')).toBe(true);

    guard.proceed = false;
    service.closePrimaryPane();
    expect(paneTree.isSplit('content')).toBe(true);
    expect(guard.captured.at(-1)).toContain(dirtyChild);

    guard.proceed = true;
    service.closePrimaryPane();
    expect(paneTree.isSplit('content')).toBe(false);
  });
});

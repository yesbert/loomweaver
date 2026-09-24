import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ContentRoute } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { CONTENT_DOCK } from '../../pane/tree/pane-address';
import { PaneTreeService } from '../../pane/tree/pane-tree.service';
import { PRIMARY_PANE } from '../../pane/tree/pane-address';
import { RetainedViewStash } from '../../pane/retention/retained-view-stash';
import { paneRetentionScope } from '../../pane/retention/retention-policy';
import { findLeaf } from '../../pane/tree/pane-queries';
import { SurfaceCloseGuard } from '../../pane/unsaved-work/surface-close-guard';
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
            version: signal(0),
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

describe('TabClosingService on a pane that is not the address-carrying one', () => {
  let service: ContentTabsService;
  let paneTree: PaneTreeService;
  let guard: CapturingCloseGuard;
  let pane: { dock: string; paneId: string };
  let dirtyKey: string;

  const paneTabs = () =>
    (findLeaf(paneTree.tree(CONTENT_DOCK), pane.paneId)?.tabs ?? []).map(
      (tab) => tab.path,
    );

  beforeEach(async () => {
    localStorage.clear();
    guard = new CapturingCloseGuard();
    TestBed.configureTestingModule({
      providers: [
        provideRouter(buildContentRoutes(ROUTES)),
        { provide: SurfaceCloseGuard, useValue: guard },
        {
          provide: RetainedViewStash,
          useValue: {
            version: signal(0),
            instancesFor: (scope: string, path: string) =>
              `${scope}|${path}` === dirtyKey
                ? [{ surfaceDirty: () => true }]
                : [],
            keyedInstances: () => [],
            evacuate: () => undefined,
          },
        },
      ],
    });
    const registry = TestBed.inject(ContributionRegistry);
    for (const route of ROUTES) registry.addContentRoute(route);
    service = TestBed.inject(ContentTabsService);
    paneTree = TestBed.inject(PaneTreeService);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/');
    service.open({ path: 'doc/a', title: 'a', titleIsLiteral: true });
    service.open({ path: 'doc/b', title: 'b', titleIsLiteral: true });
    paneTree.splitPane(CONTENT_DOCK, PRIMARY_PANE, 'row', 'doc/x');
    const source = paneTree.sourceOf('doc/x');
    if (source === null) {
      throw new Error('the split pane did not take doc/x');
    }
    pane = source;
    paneTree.insertTab(CONTENT_DOCK, pane.paneId, 'doc/y');
    paneTree.insertTab(CONTENT_DOCK, pane.paneId, 'doc/z');
    dirtyKey = '';
  });

  it('closeOthers keeps the chosen tab and the pinned ones of that pane, and leaves the group alone', () => {
    paneTree.pinTab(CONTENT_DOCK, pane.paneId, 'doc/z');
    service.closeOthers('doc/x', pane);
    expect(paneTabs().toSorted((a, b) => a.localeCompare(b))).toEqual([
      'doc/x',
      'doc/z',
    ]);
    expect(
      service
        .tabs()
        .filter((t) => t.closable)
        .map((t) => t.path),
    ).toEqual(['doc/a', 'doc/b']);
  });

  it('closeToRight closes the tabs after the chosen one in that pane', () => {
    service.closeToRight('doc/x', pane);
    expect(paneTabs()).toEqual(['doc/x']);
  });

  it('closeAll empties that pane of its closable tabs and the pane goes away', () => {
    service.closeAll(pane);
    expect(paneTabs()).toEqual([]);
    expect(paneTree.isSplit(CONTENT_DOCK)).toBe(false);
    expect(service.tabs().filter((t) => t.closable)).toHaveLength(2);
  });

  it('close removes one tab of that pane', () => {
    service.close('doc/y', pane);
    expect(paneTabs()).toEqual(['doc/x', 'doc/z']);
  });

  it('asks the guard about unsaved work at that pane, not at the group', () => {
    dirtyKey = `${paneRetentionScope(CONTENT_DOCK, pane.paneId)}|doc/y`;
    guard.proceed = false;
    service.closeOthers('doc/x', pane);
    expect(guard.captured.at(-1)).toHaveLength(1);
    expect(paneTabs()).toEqual(['doc/x', 'doc/y', 'doc/z']);
  });
});

describe('TabClosingService close hooks', () => {
  let service: ContentTabsService;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter(buildContentRoutes(ROUTES))],
    });
    const registry = TestBed.inject(ContributionRegistry);
    for (const route of ROUTES) registry.addContentRoute(route);
    service = TestBed.inject(ContentTabsService);
    harness = await RouterTestingHarness.create();
  });

  it('runs the onClose of a tab once when it is closed', async () => {
    await harness.navigateByUrl('/');
    const onClose = vi.fn();
    service.open({ path: 'doc/a', title: 'A.ts', onClose });

    service.close('doc/a');

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('logs a failed navigation after a close and still closes the tab', async () => {
    await harness.navigateByUrl('/');
    service.open({ path: 'doc/a', title: 'A.ts' });
    await harness.navigateByUrl('/doc/a');
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockRejectedValue(
      new Error('nav failed'),
    );
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    service.close('doc/a');
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(error).toHaveBeenCalledWith(
      'Content navigation failed',
      expect.any(Error),
    );
    expect(service.tabs().some((tab) => tab.path === 'doc/a')).toBe(false);
    error.mockRestore();
  });

  it('does not run onClose while the tab merely stays open', async () => {
    await harness.navigateByUrl('/');
    const onClose = vi.fn();
    service.open({ path: 'doc/a', title: 'A.ts', onClose });
    service.open({ path: 'doc/b', title: 'B.ts' });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('runs a close hook only once the tab has left the pane that carries the address', async () => {
    await harness.navigateByUrl('/');
    const onClose = vi.fn();
    service.open({ path: 'doc/a', title: 'A.ts', onClose });

    service.runCloseHook('doc/a');
    expect(onClose).not.toHaveBeenCalled();

    service.close('doc/a');
    expect(onClose).toHaveBeenCalledTimes(1);
    service.runCloseHook('doc/a');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps the teardown of a tab another pane holds when the pane carrying the address is asked to close it', async () => {
    await harness.navigateByUrl('/');
    const onClose = vi.fn();
    service.open({ path: 'doc/a', title: 'A.ts', onClose });
    const paneTree = TestBed.inject(PaneTreeService);
    paneTree.splitPane('content', PRIMARY_PANE, 'row', 'doc/a');
    paneTree.setPrimaryTabs(CONTENT_DOCK, []);

    service.close('doc/a');
    const holder = paneTree.sourceOf('doc/a');
    expect(holder).not.toBeNull();
    expect(onClose).not.toHaveBeenCalled();

    service.close('doc/a', holder ?? undefined);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

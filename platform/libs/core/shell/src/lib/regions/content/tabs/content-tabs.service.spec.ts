import { ApplicationRef, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ContentRoute } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { ContentReuseStrategy } from '../routing/content-reuse-strategy';
import { CONTENT_DOCK } from '../../pane/tree/pane-address';
import { PaneTreeService } from '../../pane/tree/pane-tree.service';
import { collectTabs } from '../../pane/tree/pane-queries';
import { PRIMARY_PANE } from '../../pane/tree/pane-address';
import { buildContentRoutes } from '../routing/content-router';
import { BootAddress } from '../routing/boot-address';
import { provideShellFeatures } from '../../../foundation/shell-features';
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

describe('ContentTabsService (findings #8/#11)', () => {
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

  it('marks a dynamic tab title literal (#8) while a declared route title stays a key', async () => {
    await harness.navigateByUrl('/dashboard/overview');
    service.open({ path: 'doc/a', title: 'A.ts', titleIsLiteral: true });

    const dynamic = service.tabs().find((tab) => tab.path === 'doc/a');
    const autoOpened = service
      .tabs()
      .find((tab) => tab.path === 'dashboard/overview');
    expect(dynamic).toMatchObject({
      title: 'A.ts',
      literalTitle: true,
      closable: true,
    });
    expect(autoOpened).toMatchObject({
      title: 'k.dash',
      literalTitle: false,
      closable: true,
    });
  });

  it('quickOpenTargets spans split panes and includes reachable surface routes (Quick-Open arc)', async () => {
    await harness.navigateByUrl('/dashboard/overview');
    service.open({ path: 'doc/a', title: 'A.ts', titleIsLiteral: true });
    const paneTree = TestBed.inject(PaneTreeService);
    paneTree.splitPane('content', PRIMARY_PANE, 'row', 'doc/b');

    const targets = service.quickOpenTargets();
    const byPath = new Map(targets.map((target) => [target.path, target]));
    expect(byPath.has('doc/a')).toBe(true);
    expect(byPath.has('doc/b')).toBe(true);
    expect(byPath.get('reports')).toMatchObject({
      title: 'k.reports',
      closable: false,
    });
    expect(byPath.get('doc/a')).toMatchObject({ closable: true });
  });

  it('navigating to a tab another pane holds focuses that pane instead of duplicating it', async () => {
    await harness.navigateByUrl('/doc/a');
    const paneTree = TestBed.inject(PaneTreeService);
    paneTree.splitPane('content', PRIMARY_PANE, 'row', 'doc/b');
    const holder = paneTree.sourceOf('doc/b')?.paneId;
    expect(holder).not.toBe(paneTree.primaryId(CONTENT_DOCK));

    await service.navigate('doc/b');

    expect(paneTree.primaryId(CONTENT_DOCK)).toBe(holder);
    expect(paneTree.sourceOf('doc/b')?.paneId).toBe(holder);
    expect(
      paneTree.primaryTabs(CONTENT_DOCK).filter((tab) => tab.path === 'doc/b'),
    ).toHaveLength(1);
    expect(paneTree.sourceOf('doc/a')?.paneId).not.toBe(
      paneTree.primaryId(CONTENT_DOCK),
    );
    expect(service.tabs().filter((tab) => tab.path === 'doc/b')).toHaveLength(
      1,
    );
  });

  it('a sub-route lands on the tab that owns it rather than opening a second copy', async () => {
    await harness.navigateByUrl('/reports');
    const paneTree = TestBed.inject(PaneTreeService);
    paneTree.splitPane('content', PRIMARY_PANE, 'row', 'note/b');

    await service.navigate('note/b/preview');

    expect(paneTree.sourceOf('note/b')?.paneId).toBe(
      paneTree.primaryId(CONTENT_DOCK),
    );
    expect(
      paneTree
        .primaryTabs(CONTENT_DOCK)
        .filter((tab) => tab.path.startsWith('note/b')),
    ).toHaveLength(1);
  });

  it('navigating home never claims a pane — home is not a tab', async () => {
    await harness.navigateByUrl('/doc/a');
    const paneTree = TestBed.inject(PaneTreeService);
    paneTree.splitPane('content', PRIMARY_PANE, 'row', 'view:outline');
    const before = paneTree.sourceOf('view:outline')?.paneId;

    await service.navigate('');

    expect(paneTree.sourceOf('view:outline')?.paneId).toBe(before);
  });

  it('revealContentTab reaches a tab held by another pane and hands it the address', async () => {
    await harness.navigateByUrl('/doc/a');
    const paneTree = TestBed.inject(PaneTreeService);
    paneTree.splitPane('content', PRIMARY_PANE, 'row', 'doc/b');

    service.revealContentTab('doc/b');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(paneTree.sourceOf('doc/b')?.paneId).toBe(
      paneTree.primaryId(CONTENT_DOCK),
    );
    expect(TestBed.inject(Router).url).toBe('/doc/b');
  });

  it('revealContentTab navigates the URL for a tab in the primary pane', async () => {
    await harness.navigateByUrl('/');
    service.open({ path: 'doc/a', title: 'A.ts' });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl');
    navigate.mockClear();

    service.revealContentTab('doc/a');

    expect(navigate).toHaveBeenCalledWith('/doc/a');
  });

  it('activeContent exposes the matched surface id, path and params (finding #19)', async () => {
    await harness.navigateByUrl('/doc/abc');
    expect(service.activeContent()).toEqual({
      surfaceId: 'testbed.doc',
      path: 'doc/abc',
      params: { id: 'abc' },
    });

    await harness.navigateByUrl('/dashboard/overview');
    expect(service.activeContent()).toEqual({
      surfaceId: null,
      path: 'dashboard/overview',
      params: {},
    });
  });

  it('runs the tab onClose hook once when the tab is closed (#11)', async () => {
    await harness.navigateByUrl('/');
    const onClose = vi.fn();
    service.open({ path: 'doc/a', title: 'A.ts', onClose });

    service.close('doc/a');

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('logs a rejecting close navigation and still evicts the closed tab (no unhandled rejection)', async () => {
    await harness.navigateByUrl('/');
    service.open({ path: 'doc/a', title: 'A.ts' });
    await harness.navigateByUrl('/doc/a');
    const reuse = TestBed.inject(ContentReuseStrategy);
    const evict = vi.spyOn(reuse, 'evict');
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
    expect(evict).toHaveBeenCalledWith('doc/a');
    error.mockRestore();
  });

  it('does not run onClose while the tab merely stays open', async () => {
    await harness.navigateByUrl('/');
    const onClose = vi.fn();
    service.open({ path: 'doc/a', title: 'A.ts', onClose });
    service.open({ path: 'doc/b', title: 'B.ts' });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('persists the open set (title + pin) in the pane tree — the URL group reloads', async () => {
    await harness.navigateByUrl('/');
    service.open({ path: 'doc/a', title: 'A.ts', titleIsLiteral: true });
    service.pin('doc/a');

    const raw = localStorage.getItem('lw.shell.pane-trees:default') ?? '';
    expect(raw).toContain('doc/a');
    expect(raw).toContain('A.ts');
    expect(raw).toContain('"pinned":true');
  });

  it('open() only REFINES a tab living in another pane group — no URL-group duplicate, no navigation', async () => {
    await harness.navigateByUrl('/');
    const paneTree = TestBed.inject(PaneTreeService);
    paneTree.splitPane('content', PRIMARY_PANE, 'row', 'doc/a');

    service.open({
      path: 'doc/a',
      title: 'A.ts',
      titleIsLiteral: true,
      icon: 'testbedDocument',
    });

    expect(paneTree.primaryTabs('content').map((t) => t.path)).toEqual([]);
    const secondary = paneTree.tree('content') as {
      second: { tabs: readonly { path: string; title?: string }[] };
    };
    expect(secondary.second.tabs[0]).toMatchObject({
      path: 'doc/a',
      title: 'A.ts',
    });
    expect(TestBed.inject(Router).url).toBe('/');
  });

  it('navigating to a tab the URL pane already holds leaves the layout alone', async () => {
    await harness.navigateByUrl('/doc/a');
    const paneTree = TestBed.inject(PaneTreeService);
    paneTree.splitPane('content', PRIMARY_PANE, 'row', 'doc/a');
    TestBed.inject(ApplicationRef).tick();
    const before = paneTree.serialize();

    await service.navigate('doc/a');
    TestBed.inject(ApplicationRef).tick();

    expect(paneTree.serialize()).toBe(before);
  });

  it('an ordinary navigation reaches the copy another pane already holds', async () => {
    await harness.navigateByUrl('/doc/a');
    const paneTree = TestBed.inject(PaneTreeService);
    paneTree.splitPane('content', PRIMARY_PANE, 'row', 'doc/b');
    TestBed.inject(ApplicationRef).tick();

    await TestBed.inject(Router).navigateByUrl('/doc/b');
    TestBed.inject(ApplicationRef).tick();

    expect(paneTree.primaryTabs('content').map((tab) => tab.path)).toEqual([
      'doc/b',
    ]);
    expect(
      collectTabs(paneTree.tree('content')).filter(
        (tab) => tab.path === 'doc/b',
      ),
    ).toHaveLength(1);
    expect(
      collectTabs(paneTree.tree('content')).some((tab) => tab.path === 'doc/a'),
    ).toBe(true);
  });

  it("a link and the workbench's own call both reach the pane that holds it", async () => {
    await harness.navigateByUrl('/doc/a');
    const paneTree = TestBed.inject(PaneTreeService);
    paneTree.splitPane('content', PRIMARY_PANE, 'row', 'doc/b');
    TestBed.inject(ApplicationRef).tick();

    await TestBed.inject(Router).navigateByUrl('/doc/b');
    TestBed.inject(ApplicationRef).tick();
    expect(paneTree.primaryTabs('content').map((tab) => tab.path)).toEqual([
      'doc/b',
    ]);

    await service.navigate('doc/a');
    TestBed.inject(ApplicationRef).tick();
    expect(paneTree.primaryTabs('content').map((tab) => tab.path)).toEqual([
      'doc/a',
    ]);
  });

  it('an ordinary navigation to nothing open lands where the address already is', async () => {
    await harness.navigateByUrl('/doc/a');
    const paneTree = TestBed.inject(PaneTreeService);
    paneTree.splitPane('content', PRIMARY_PANE, 'row', 'doc/b');
    TestBed.inject(ApplicationRef).tick();

    await TestBed.inject(Router).navigateByUrl('/reports');
    TestBed.inject(ApplicationRef).tick();

    expect(paneTree.primaryId('content')).toBe(PRIMARY_PANE);
    expect(paneTree.primaryTabs('content').map((tab) => tab.path)).toEqual([
      'doc/a',
      'reports',
    ]);
  });

  it('runCloseHook runs the teardown only once the tab left the URL group', async () => {
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

  const dynamicOrder = () =>
    service
      .tabs()
      .filter((tab) => tab.closable)
      .map((tab) => tab.path);

  it('bringToFront front-inserts a dynamic tab (MRU reveal of a clipped tab)', async () => {
    await harness.navigateByUrl('/');
    service.open({ path: 'doc/a', title: 'A.ts' });
    service.open({ path: 'doc/b', title: 'B.ts' });
    service.open({ path: 'doc/c', title: 'C.ts' });
    expect(dynamicOrder()).toEqual(['doc/a', 'doc/b', 'doc/c']);

    service.bringToFront('doc/c');

    expect(dynamicOrder()).toEqual(['doc/c', 'doc/a', 'doc/b']);
  });

  it('bringToFront keeps pinned tabs anchored ahead of the unpinned front', async () => {
    await harness.navigateByUrl('/');
    service.open({ path: 'doc/a', title: 'A.ts' });
    service.open({ path: 'doc/b', title: 'B.ts' });
    service.pin('doc/a');

    service.bringToFront('doc/b');

    expect(dynamicOrder()).toEqual(['doc/a', 'doc/b']);
  });

  it('writes the strip order to the pane that holds the tabs (TreeWeaver #41)', async () => {
    await harness.navigateByUrl('/');
    service.open({ path: 'doc/a', title: 'A.ts' });
    service.open({ path: 'doc/b', title: 'B.ts' });
    service.open({ path: 'doc/c', title: 'C.ts' });
    const paneTree = TestBed.inject(PaneTreeService);

    service.bringToFront('doc/c');
    expect(paneTree.primaryTabs(CONTENT_DOCK).map((tab) => tab.path)).toEqual([
      'doc/c',
      'doc/a',
      'doc/b',
    ]);

    service.reorder(['doc/a', 'doc/b', 'doc/c']);
    expect(paneTree.primaryTabs(CONTENT_DOCK).map((tab) => tab.path)).toEqual([
      'doc/a',
      'doc/b',
      'doc/c',
    ]);
    expect(localStorage.getItem('lw.shell.item-order')).toBeNull();
  });

  it('bringToFront is a no-op for a pinned or unknown tab', async () => {
    await harness.navigateByUrl('/');
    service.open({ path: 'doc/a', title: 'A.ts' });
    service.open({ path: 'doc/b', title: 'B.ts' });
    service.pin('doc/b');

    service.bringToFront('doc/b');
    service.bringToFront('doc/zzz');

    expect(dynamicOrder()).toEqual(['doc/b', 'doc/a']);
  });
});

describe('ContentTabsService preview tabs (#10)', () => {
  let service: ContentTabsService;
  let harness: RouterTestingHarness;

  const openTab = (id: string, preview: boolean) =>
    service.open({
      path: `doc/${id}`,
      title: `${id}.ts`,
      titleIsLiteral: true,
      preview,
    });
  const dynamicTabs = () => service.tabs().filter((tab) => tab.closable);
  const tab = (id: string) =>
    service.tabs().find((t) => t.path === `doc/${id}`);

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
  });

  it('opens a preview tab (marked preview)', () => {
    openTab('a', true);
    expect(tab('a')?.preview).toBe(true);
  });

  it('reuses the single preview slot for a different path instead of adding a tab', () => {
    openTab('a', true);
    openTab('b', true);
    expect(dynamicTabs().map((t) => t.path)).toEqual(['doc/b']);
    expect(tab('b')?.preview).toBe(true);
  });

  it('promotes the preview tab to permanent via keep()', () => {
    openTab('a', true);
    service.keep('doc/a');
    expect(tab('a')?.preview).toBe(false);
  });

  it('preserves preview state on an idempotent re-open (promotion is explicit via keep)', () => {
    openTab('a', true);
    openTab('a', false);
    expect(tab('a')?.preview).toBe(true);
    expect(dynamicTabs()).toHaveLength(1);
    service.keep('doc/a');
    expect(tab('a')?.preview).toBe(false);
  });

  it('keeps a promoted tab and adds a new preview alongside it', () => {
    openTab('a', true);
    service.keep('doc/a');
    openTab('b', true);
    expect(dynamicTabs().map((t) => t.path)).toEqual(['doc/a', 'doc/b']);
    expect(tab('a')?.preview).toBe(false);
    expect(tab('b')?.preview).toBe(true);
  });
});

describe('ContentTabsService pinned tabs', () => {
  let service: ContentTabsService;
  let harness: RouterTestingHarness;

  const open = (id: string, preview = false) =>
    service.open({
      path: `doc/${id}`,
      title: `${id}.ts`,
      titleIsLiteral: true,
      preview,
    });
  const tab = (id: string) =>
    service.tabs().find((t) => t.path === `doc/${id}`);
  const dynamicPaths = () =>
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
  });

  it('pins a tab and shows the pinned marker', () => {
    open('a');
    service.pin('doc/a');
    expect(tab('a')).toMatchObject({ pinned: true, closable: true });
  });

  it('sorts a pinned tab ahead of unpinned dynamic tabs, keeping open order within each band', () => {
    open('a');
    open('b');
    open('c');
    service.pin('doc/c');
    expect(dynamicPaths()).toEqual(['doc/c', 'doc/a', 'doc/b']);
  });

  it('promotes a preview tab when pinned (a pinned tab is never transient)', () => {
    open('a', true);
    expect(tab('a')?.preview).toBe(true);
    service.pin('doc/a');
    expect(tab('a')).toMatchObject({ pinned: true, preview: false });
  });

  it('unpins a tab back to a normal, closable tab', () => {
    open('a');
    service.pin('doc/a');
    service.unpin('doc/a');
    expect(tab('a')).toMatchObject({ pinned: false, closable: true });
  });

  it('preserves the pinned state across an idempotent re-open', () => {
    open('a');
    service.pin('doc/a');
    open('a');
    expect(tab('a')?.pinned).toBe(true);
  });
});

describe('ContentTabsService with preview disabled', () => {
  let service: ContentTabsService;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter(buildContentRoutes(ROUTES)),
        provideShellFeatures({ content: { preview: false } }),
      ],
    });
    const registry = TestBed.inject(ContributionRegistry);
    for (const route of ROUTES) registry.addContentRoute(route);
    service = TestBed.inject(ContentTabsService);
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/');
  });

  it('ignores the preview flag — every open is a permanent tab', () => {
    service.open({
      path: 'doc/a',
      title: 'A.ts',
      titleIsLiteral: true,
      preview: true,
    });
    expect(service.tabs().find((t) => t.path === 'doc/a')?.preview).toBe(false);
  });
});

describe('ContentTabsService view tabs in the URL group', () => {
  let service: ContentTabsService;
  let paneTree: PaneTreeService;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter(buildContentRoutes(ROUTES))],
    });
    const registry = TestBed.inject(ContributionRegistry);
    for (const route of ROUTES) registry.addContentRoute(route);
    registry.addView({
      id: 'outline',
      region: 'primary',
      title: 'outline.title',
      component: TestContent,
    });
    service = TestBed.inject(ContentTabsService);
    paneTree = TestBed.inject(PaneTreeService);
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/');
  });

  it('renders a group-held view tab after the dynamic band and activates it without navigating', async () => {
    paneTree.seedPrimaryTabs('content', ['view:outline']);

    const viewTab = service.tabs().find((tab) => tab.path === 'view:outline');
    expect(viewTab).toMatchObject({
      title: 'outline.title',
      closable: true,
      literalTitle: false,
    });

    service.activateViewTab('view:outline');
    expect(service.activeViewPath()).toBe('view:outline');
    expect(TestBed.inject(Router).url).toBe('/');
  });

  it('a real navigation ends the view-tab selection (the router takes the area back)', async () => {
    paneTree.seedPrimaryTabs('content', ['view:outline']);
    service.activateViewTab('view:outline');

    await harness.navigateByUrl('/doc/a');

    expect(service.activeViewPath()).toBeNull();
  });

  it('closing a view tab drops it from the group and self-heals the selection', () => {
    paneTree.seedPrimaryTabs('content', ['view:outline']);
    service.activateViewTab('view:outline');

    service.close('view:outline');

    expect(
      paneTree
        .primaryTabs('content')
        .some((tab) => tab.path === 'view:outline'),
    ).toBe(false);
    expect(service.activeViewPath()).toBeNull();
  });

  it('route-tab writes (open/close) carry the group view tabs along untouched', () => {
    paneTree.seedPrimaryTabs('content', ['view:outline']);

    service.open({ path: 'doc/a', title: 'A.ts', titleIsLiteral: true });
    service.close('doc/a');

    expect(paneTree.primaryTabs('content').map((tab) => tab.path)).toContain(
      'view:outline',
    );
  });

  it('ignores activating a view tab the group does not hold', () => {
    service.activateViewTab('view:outline');
    expect(service.activeViewPath()).toBeNull();
  });

  it('keeps a selection made once its own navigation settles (the URL effect only ends external moves)', async () => {
    paneTree.seedPrimaryTabs('content', ['view:outline']);

    await service.navigate('doc/a');
    service.activateViewTab('view:outline');
    TestBed.tick();

    expect(service.activeViewPath()).toBe('view:outline');
  });

  it('closing the URL pane onto a view-only neighbour keeps that view reachable and shown', async () => {
    paneTree.splitPane('content', PRIMARY_PANE, 'row', 'view:outline');

    service.closePrimaryPane();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(paneTree.isSplit('content')).toBe(false);
    expect(paneTree.primaryTabs('content').map((tab) => tab.path)).toEqual([
      'view:outline',
    ]);
    expect(service.showStrip()).toBe(true);
    expect(service.activeViewPath()).toBe('view:outline');
  });
});

function documentAt(pathname: string): Document {
  return new Proxy(document, {
    get: (target, prop) =>
      prop === 'location'
        ? { pathname }
        : (Reflect.get(target, prop, target) as unknown),
  });
}

describe('ContentTabsService in a pop-out window', () => {
  async function setUpAt(pathname: string) {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter(buildContentRoutes(ROUTES)),
        { provide: DOCUMENT, useValue: documentAt(pathname) },
        { provide: BootAddress, useValue: { path: pathname } },
      ],
    });
    const registry = TestBed.inject(ContributionRegistry);
    for (const route of ROUTES) registry.addContentRoute(route);
    const service = TestBed.inject(ContentTabsService);
    const harness = await RouterTestingHarness.create('/');
    return { service, harness };
  }

  it('refuses to navigate, so the window cannot stop being a pop-out', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { service } = await setUpAt('/popout/reports');

    const moved = await service.navigate('reports');

    expect(moved).toBe(false);
    expect(TestBed.inject(Router).url).toBe('/');
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('pop-out window'),
    );
    warn.mockRestore();
  });

  it('refuses an ordinary navigation too, so a link cannot leave the pop-out', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await setUpAt('/popout/reports');

    const moved = await TestBed.inject(Router).navigateByUrl('/reports');

    expect(moved).toBe(false);
    expect(TestBed.inject(Router).url).toBe('/');
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('pop-out window'),
    );
    warn.mockRestore();
  });

  it('navigates normally in the main window', async () => {
    const { service } = await setUpAt('/');

    await expect(service.navigate('reports')).resolves.toBe(true);
    expect(TestBed.inject(Router).url).toBe('/reports');
  });

  it('lets an ordinary navigation through in the main window', async () => {
    await setUpAt('/');

    await expect(
      TestBed.inject(Router).navigateByUrl('/reports'),
    ).resolves.toBe(true);
    expect(TestBed.inject(Router).url).toBe('/reports');
  });
});

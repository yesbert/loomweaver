import { Component, EnvironmentProviders, Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ContentRoute } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { CONTENT_DOCK, PRIMARY_PANE } from '../../pane/tree/pane-address';
import { PaneTreeService } from '../../pane/tree/pane-tree.service';
import { buildContentRoutes } from '../routing/content-router';
import { ContentTabsService } from './content-tabs.service';
import { provideTabAddressResolver } from './tab-address';

@Component({ selector: 'lw-test-content', template: '' })
class TestContent {}

const ROUTES: readonly ContentRoute[] = [
  { path: '', component: TestContent },
  { path: 'doc/:id', component: TestContent, id: 'testbed.doc' },
  { path: 'dashboard/overview', component: TestContent, title: 'k.dash' },
  { path: 'reports', component: TestContent, title: 'k.reports' },
];

async function setUp(
  routes: readonly ContentRoute[] = ROUTES,
  providers: (Provider | EnvironmentProviders)[] = [],
) {
  localStorage.clear();
  TestBed.configureTestingModule({
    providers: [provideRouter(buildContentRoutes(routes)), ...providers],
  });
  const registry = TestBed.inject(ContributionRegistry);
  for (const route of routes) registry.addContentRoute(route);
  const service = TestBed.inject(ContentTabsService);
  const harness = await RouterTestingHarness.create();
  return { service, harness };
}

describe('The tabs of the pane that carries the address', () => {
  let service: ContentTabsService;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    ({ service, harness } = await setUp());
  });

  it('lists the open tabs of every pane and the routes the user can reach', async () => {
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

  it('exposes the active surface id, path and params', async () => {
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

  it('keeps the open tabs with their title and pin in the pane tree, so they reload', async () => {
    await harness.navigateByUrl('/');
    service.open({ path: 'doc/a', title: 'A.ts', titleIsLiteral: true });
    service.pin('doc/a');

    const raw = localStorage.getItem('lw.shell.pane-trees:default') ?? '';
    expect(raw).toContain('doc/a');
    expect(raw).toContain('A.ts');
    expect(raw).toContain('"pinned":true');
  });

  const dynamicOrder = () =>
    service
      .tabs()
      .filter((tab) => tab.closable)
      .map((tab) => tab.path);

  it('brings a clipped tab to the front of the unpinned tabs', async () => {
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

  it('writes the strip order to the pane that holds the tabs', async () => {
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

describe('The strip', () => {
  const MIXED: readonly ContentRoute[] = [
    { path: '', component: TestContent },
    { path: 'doc/:id', component: TestContent },
    { path: 'run/:id', component: TestContent },
    { path: 'dashboard/overview', component: TestContent, title: 'k.dash' },
    { path: 'login', component: TestContent, chromeless: true },
  ];

  let service: ContentTabsService;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    ({ service, harness } = await setUp(MIXED));
  });

  it('shows every open tab side by side, whichever one is active', async () => {
    service.open({ path: 'doc/a', title: 'A' });
    service.open({ path: 'run/7', title: 'R' });
    await harness.navigateByUrl('/doc/a');

    expect(service.tabs().map((tab) => tab.path)).toEqual(['doc/a', 'run/7']);

    await harness.navigateByUrl('/run/7');

    expect(service.tabs().map((tab) => tab.path)).toEqual(['doc/a', 'run/7']);
  });

  it('visiting a plain surface route auto-opens a closable tab', async () => {
    await harness.navigateByUrl('/dashboard/overview');

    expect(
      service.tabs().find((tab) => tab.path === 'dashboard/overview'),
    ).toMatchObject({ title: 'k.dash', literalTitle: false, closable: true });
    expect(service.showStrip()).toBe(true);
  });

  it('a chromeless surface never becomes a tab and shows no strip', async () => {
    service.open({ path: 'doc/a', title: 'A' });
    await harness.navigateByUrl('/login');

    expect(service.showStrip()).toBe(false);
    expect(service.tabs().some((tab) => tab.path === 'login')).toBe(false);

    await harness.navigateByUrl('/doc/a');
    expect(service.showStrip()).toBe(true);
  });

  it('shows no strip while the pane holds no tabs at all', async () => {
    await harness.navigateByUrl('/');

    expect(service.showStrip()).toBe(false);
    expect(service.tabs()).toEqual([]);
  });

  it('closes every open tab in one go', async () => {
    service.open({ path: 'doc/a', title: 'A' });
    service.open({ path: 'run/7', title: 'R' });
    await harness.navigateByUrl('/run/7');

    service.closeAll();

    expect(service.tabs()).toEqual([]);
  });
});

describe('Pinned tabs', () => {
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
    ({ service, harness } = await setUp());
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

  it('promotes a preview tab when it is pinned', () => {
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

describe('Tabs that follow the address', () => {
  const FACETS: readonly ContentRoute[] = [
    { path: '', component: TestContent },
    {
      path: 'cedents/:cedentId/programs/:programId/pricing',
      component: TestContent,
      follows: true,
      title: 'k.pricing',
      order: 0,
    },
    {
      path: 'cedents/:cedentId/programs/:programId/treaties',
      component: TestContent,
      follows: true,
      title: 'k.treaties',
      order: 1,
    },
    { path: 'settings', component: TestContent, title: 'k.settings' },
  ];

  const setup = (providers: (Provider | EnvironmentProviders)[] = []) =>
    setUp(FACETS, providers);

  const navPathOf = (service: ContentTabsService, title: string) =>
    service.tabs().find((tab) => tab.title === title)?.navPath;

  it('points a following tab at the current selection', async () => {
    const { service, harness } = await setup();

    await harness.navigateByUrl('/cedents/US003950/programs/205470/pricing');

    expect(navPathOf(service, 'k.treaties')).toBe(
      'cedents/US003950/programs/205470/treaties',
    );
  });

  it('leaves an open tab that did not opt in on its own address', async () => {
    const { service, harness } = await setup();
    await harness.navigateByUrl('/settings');

    await harness.navigateByUrl('/cedents/US003950/programs/205470/pricing');

    expect(navPathOf(service, 'k.settings')).toBe('settings');
  });

  it('truncates before a value it does not know, and lands on whoever owns that prefix', async () => {
    const { service, harness } = await setup();
    TestBed.inject(ContributionRegistry).addContentRoute({
      path: 'cedents',
      component: TestContent,
    } as ContentRoute);

    await harness.navigateByUrl('/settings');

    expect(navPathOf(service, 'k.treaties')).toBe('cedents');
  });

  it('offers no move on a following tab, which the pane does not hold', async () => {
    const { service, harness } = await setup();

    await harness.navigateByUrl('/cedents/US003950/programs/205470/pricing');

    const movable = new Map(
      service.tabs().map((tab) => [tab.title, tab.movable]),
    );
    expect(movable.get('k.pricing')).toBe(false);
    expect(movable.get('k.treaties')).toBe(false);
  });

  it('leaves a following tab out while its address is nowhere to go', async () => {
    const { service, harness } = await setup();

    await harness.navigateByUrl('/settings');

    expect(service.tabs().map((tab) => tab.title)).toEqual(['k.settings']);
  });

  it('lets the distribution override the computation, per tab', async () => {
    const { service, harness } = await setup([
      provideTabAddressResolver(({ surfaceId, params }) =>
        surfaceId === 'treaties'
          ? `cedents/${params['cedentId']}/treaties/881498`
          : null,
      ),
    ]);
    const registry = TestBed.inject(ContributionRegistry);
    registry.addContentRoute({
      ...FACETS[2],
      id: 'treaties',
      path: 'cedents/:cedentId/programs/:programId/treaties',
      follows: true,
    } as ContentRoute);

    await harness.navigateByUrl('/cedents/US003950/programs/205470/pricing');

    expect(navPathOf(service, 'k.treaties')).toBe(
      'cedents/US003950/treaties/881498',
    );
    expect(navPathOf(service, 'k.pricing')).toBe(
      'cedents/US003950/programs/205470/pricing',
    );
  });

  it('never rewrites a copy another pane holds', async () => {
    const { service, harness } = await setup();
    await harness.navigateByUrl('/cedents/US003950/programs/205470/pricing');
    const paneTree = TestBed.inject(PaneTreeService);
    paneTree.splitPane(
      'content',
      PRIMARY_PANE,
      'row',
      'cedents/US003950/programs/205470/treaties',
    );

    await harness.navigateByUrl('/cedents/US009999/programs/111111/pricing');

    const split = paneTree.tree('content') as {
      second: { tabs: readonly { path: string }[] };
    };
    expect(split.second.tabs[0].path).toBe(
      'cedents/US003950/programs/205470/treaties',
    );
    expect(navPathOf(service, 'k.treaties')).toBe(
      'cedents/US009999/programs/111111/treaties',
    );
  });
});

import { Component, EnvironmentProviders, Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ContentRoute } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { provideShellFeatures } from '../../../foundation/shell-features';
import { CONTENT_DOCK, PRIMARY_PANE } from '../../pane/tree/pane-address';
import { PaneTreeService } from '../../pane/tree/pane-tree.service';
import { findLeaf } from '../../pane/tree/pane-queries';
import { PaneLeaf, PaneTab } from '../../pane/tree/pane-node';
import { buildContentRoutes } from '../routing/content-router';
import { ContentTabsService } from './content-tabs.service';
import { TabCloseHooks } from './tab-close-hooks';

@Component({ selector: 'lw-test-content', template: '' })
class TestContent {}

const ROUTES: readonly ContentRoute[] = [
  { path: '', component: TestContent },
  { path: 'doc/:id', component: TestContent, id: 'testbed.doc' },
  { path: 'dashboard/overview', component: TestContent, title: 'k.dash' },
  { path: 'reports', component: TestContent, title: 'k.reports' },
];

async function setUp(providers: (Provider | EnvironmentProviders)[] = []) {
  localStorage.clear();
  TestBed.configureTestingModule({
    providers: [provideRouter(buildContentRoutes(ROUTES)), ...providers],
  });
  const registry = TestBed.inject(ContributionRegistry);
  for (const route of ROUTES) registry.addContentRoute(route);
  const service = TestBed.inject(ContentTabsService);
  const harness = await RouterTestingHarness.create();
  return { service, harness, registry };
}

describe('Opening a content tab', () => {
  let service: ContentTabsService;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    ({ service, harness } = await setUp());
  });

  it('marks the title of an opened tab literal while a declared route title stays a key', async () => {
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

  it('relabels a tab another pane holds instead of opening a second copy or navigating', async () => {
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
});

describe('Preview tabs', () => {
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
    ({ service, harness } = await setUp());
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

  it('keeps the preview state when the same tab is opened again, until it is kept', () => {
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

describe('The one preview in the main area', () => {
  let service: ContentTabsService;
  let paneTree: PaneTreeService;
  let router: Router;
  let harness: RouterTestingHarness;

  const leaf = (id: string, tabs: PaneTab[]): PaneLeaf => ({
    kind: 'leaf',
    id,
    tabs,
    active: tabs.at(-1)?.path,
  });

  const arrange = (main: PaneTab[], side: PaneTab[]): void => {
    paneTree.commit(CONTENT_DOCK, {
      kind: 'split',
      id: 'split',
      orientation: 'row',
      ratio: 0.5,
      first: leaf(PRIMARY_PANE, main),
      second: leaf('side', side),
    });
  };

  const tabsOf = (id: string) =>
    findLeaf(paneTree.tree(CONTENT_DOCK), id)?.tabs.map((tab) => ({
      path: tab.path,
      preview: tab.preview === true,
    }));

  const openPreview = async (id: string) => {
    service.open({
      path: `doc/${id}`,
      title: `${id}.ts`,
      titleIsLiteral: true,
      preview: true,
    });
    await harness.fixture.whenStable();
  };

  beforeEach(async () => {
    ({ service, harness } = await setUp());
    paneTree = TestBed.inject(PaneTreeService);
    router = TestBed.inject(Router);
    await harness.navigateByUrl('/reports');
  });

  it('replaces the preview in the pane it was moved to and hands that pane the address', async () => {
    const closed: string[] = [];
    TestBed.inject(TabCloseHooks).set('doc/a', () => {
      closed.push('a');
    });
    arrange(
      [{ path: 'reports' }],
      [{ path: 'doc/x' }, { path: 'doc/a', preview: true }, { path: 'doc/y' }],
    );

    await openPreview('b');

    expect(tabsOf('side')).toEqual([
      { path: 'doc/x', preview: false },
      { path: 'doc/b', preview: true },
      { path: 'doc/y', preview: false },
    ]);
    expect(findLeaf(paneTree.tree(CONTENT_DOCK), 'side')?.active).toBe('doc/b');
    expect(tabsOf(PRIMARY_PANE)).toEqual([{ path: 'reports', preview: false }]);
    expect(paneTree.primaryId(CONTENT_DOCK)).toBe('side');
    expect(router.url).toBe('/doc/b');
    expect(closed).toEqual(['a']);
  });

  it('replaces the one in the pane carrying the address first when an old arrangement holds several', async () => {
    arrange(
      [{ path: 'reports' }, { path: 'doc/m', preview: true }],
      [{ path: 'doc/s', preview: true }],
    );

    await openPreview('b');

    expect(tabsOf(PRIMARY_PANE)).toEqual([
      { path: 'reports', preview: false },
      { path: 'doc/b', preview: true },
    ]);
    expect(tabsOf('side')).toEqual([{ path: 'doc/s', preview: true }]);
    expect(paneTree.primaryId(CONTENT_DOCK)).toBe(PRIMARY_PANE);
  });

  it('opens in the pane carrying the address when the main area holds no preview', async () => {
    arrange([{ path: 'reports' }], [{ path: 'doc/x' }]);

    await openPreview('b');

    expect(tabsOf(PRIMARY_PANE)).toEqual([
      { path: 'reports', preview: false },
      { path: 'doc/b', preview: true },
    ]);
    expect(tabsOf('side')).toEqual([{ path: 'doc/x', preview: false }]);
    expect(router.url).toBe('/doc/b');
  });
});

describe('Opening with preview switched off', () => {
  let service: ContentTabsService;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    ({ service, harness } = await setUp([
      provideShellFeatures({ content: { preview: false } }),
    ]));
    await harness.navigateByUrl('/');
  });

  it('ignores the preview flag, so every open is a permanent tab', () => {
    service.open({
      path: 'doc/a',
      title: 'A.ts',
      titleIsLiteral: true,
      preview: true,
    });
    expect(service.tabs().find((t) => t.path === 'doc/a')?.preview).toBe(false);
  });
});

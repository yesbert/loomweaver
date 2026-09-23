import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ContentRoute, TabBadge } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { CONTENT_DOCK } from '../../pane/tree/pane-address';
import { PaneTreeService } from '../../pane/tree/pane-tree.service';
import { collectTabs } from '../../pane/tree/pane-queries';
import { normalizeNode } from '../../pane/tree/pane-restore';
import { buildContentRoutes } from '../routing/content-router';
import { ContentTabsService } from './content-tabs.service';

@Component({ selector: 'lw-test-content', template: '' })
class TestContent {}

const ROUTES: readonly ContentRoute[] = [
  { path: '', component: TestContent },
  { path: 'doc/:id', component: TestContent, id: 'testbed.doc' },
];

const BETA: TabBadge = { text: 'badges.beta', tone: 'brand' };
const DRAFT: TabBadge = { text: 'Draft', textIsLiteral: true };

describe('a tab carries a badge', () => {
  let service: ContentTabsService;
  let registry: ContributionRegistry;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter(buildContentRoutes(ROUTES))],
    });
    registry = TestBed.inject(ContributionRegistry);
    for (const route of ROUTES) registry.addContentRoute(route);
    service = TestBed.inject(ContentTabsService);
    await RouterTestingHarness.create();
  });

  function badgeOf(path: string): TabBadge | undefined {
    return service.tabs().find((tab) => tab.path === path)?.badge;
  }

  function storedTab(path: string) {
    return collectTabs(TestBed.inject(PaneTreeService).tree(CONTENT_DOCK)).find(
      (tab) => tab.path === path,
    );
  }

  it("shows the badge of the surface a tab shows", () => {
    registry.updateSurfaceBadge('testbed.doc', BETA);

    service.open({ path: 'doc/a', title: 'A', titleIsLiteral: true });

    expect(badgeOf('doc/a')).toEqual(BETA);
  });

  it("follows a change of the surface's badge, and a badge taken away", () => {
    service.open({ path: 'doc/a', title: 'A', titleIsLiteral: true });

    registry.updateSurfaceBadge('testbed.doc', BETA);
    expect(badgeOf('doc/a')).toEqual(BETA);

    registry.updateSurfaceBadge('testbed.doc', null);
    expect(badgeOf('doc/a')).toBeUndefined();
  });

  it('changes a badge without recomputing the content routes', () => {
    const before = registry.contentRoutes();

    registry.updateSurfaceBadge('testbed.doc', BETA);

    expect(registry.contentRoutes()).toBe(before);
  });

  it('changes nothing for an id nothing was registered under', () => {
    registry.updateSurfaceBadge('nothing.here', BETA);

    expect(registry.badgeOf('nothing.here')).toBeUndefined();
  });

  it("lets a tab's own badge win over the surface's", () => {
    registry.updateSurfaceBadge('testbed.doc', BETA);

    service.open({
      path: 'doc/a',
      title: 'A',
      titleIsLiteral: true,
      badge: DRAFT,
    });

    expect(badgeOf('doc/a')).toEqual(DRAFT);
  });

  it("keeps a tab's own badge with the tab, so it survives a restart", () => {
    service.open({
      path: 'doc/a',
      title: 'A',
      titleIsLiteral: true,
      badge: DRAFT,
    });

    expect(storedTab('doc/a')?.badge).toEqual(DRAFT);
    const tree = TestBed.inject(PaneTreeService).tree(CONTENT_DOCK);
    const restored = normalizeNode(structuredClone(tree));
    expect(
      restored && collectTabs(restored).find((tab) => tab.path === 'doc/a')?.badge,
    ).toEqual(DRAFT);
  });

  it('does not store the badge of the surface with the tab', () => {
    registry.updateSurfaceBadge('testbed.doc', BETA);

    service.open({ path: 'doc/a', title: 'A', titleIsLiteral: true });

    expect(storedTab('doc/a')?.badge).toBeUndefined();
  });

  it("takes a tab's own badge away with null, so the surface's shows again", () => {
    registry.updateSurfaceBadge('testbed.doc', BETA);
    service.open({ path: 'doc/a', title: 'A', titleIsLiteral: true, badge: DRAFT });

    service.open({ path: 'doc/a', title: 'A', titleIsLiteral: true, badge: null });

    expect(badgeOf('doc/a')).toEqual(BETA);
    expect(storedTab('doc/a')?.badge).toBeUndefined();
  });

  it("does not let an empty badge of a tab's own hide the surface's", () => {
    registry.updateSurfaceBadge('testbed.doc', BETA);

    service.open({ path: 'doc/a', title: 'A', titleIsLiteral: true, badge: {} });

    expect(badgeOf('doc/a')).toEqual(BETA);
  });

  it("carries a tab's own badge into the pane a split opens", () => {
    service.open({ path: 'doc/a', title: 'A', titleIsLiteral: true, badge: DRAFT });
    const paneTree = TestBed.inject(PaneTreeService);

    paneTree.splitPane(CONTENT_DOCK, paneTree.primaryId(CONTENT_DOCK), 'row', 'doc/a');

    const copies = collectTabs(paneTree.tree(CONTENT_DOCK)).filter(
      (tab) => tab.path === 'doc/a',
    );
    expect(copies).toHaveLength(2);
    expect(copies.map((tab) => tab.badge)).toEqual([DRAFT, DRAFT]);
  });

  it("refines a tab's own badge when the tab is opened again", () => {
    service.open({
      path: 'doc/a',
      title: 'A',
      titleIsLiteral: true,
      badge: DRAFT,
    });

    service.open({
      path: 'doc/a',
      title: 'A',
      titleIsLiteral: true,
      badge: BETA,
    });

    expect(badgeOf('doc/a')).toEqual(BETA);
  });
});

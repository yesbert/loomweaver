import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ContentRoute } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { CONTENT_DOCK, PRIMARY_PANE } from '../../pane/tree/pane-address';
import { PaneTab } from '../../pane/tree/pane-node';
import { collectTabs, findLeaf } from '../../pane/tree/pane-queries';
import { PaneTreeService } from '../../pane/tree/pane-tree.service';
import { buildContentRoutes } from '../routing/content-router';
import { ContentTabsService } from './content-tabs.service';

@Component({ selector: 'lw-test-content', template: '' })
class TestContent {}

const ROUTES: readonly ContentRoute[] = [
  { path: '', component: TestContent },
  { path: 'doc/:id', component: TestContent },
  { path: 'note/:id', component: TestContent },
];

const DRAFT = { text: 'Draft', textIsLiteral: true } as const;
const SENT = { text: 'Sent', textIsLiteral: true, tone: 'brand' } as const;

describe('changing the label of an open tab where it stands', () => {
  let tabs: ContentTabsService;
  let paneTree: PaneTreeService;
  let router: Router;
  let harness: RouterTestingHarness;

  const stored = (path: string): PaneTab | undefined =>
    collectTabs(paneTree.tree(CONTENT_DOCK)).find((tab) => tab.path === path);

  async function settle(): Promise<void> {
    await harness.fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await harness.fixture.whenStable();
  }

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter(buildContentRoutes(ROUTES))],
    });
    const registry = TestBed.inject(ContributionRegistry);
    registry.addContentRoute(ROUTES[0]);
    registry.addContentRoute(ROUTES[1], 'docs');
    registry.addContentRoute(ROUTES[2], 'notes');
    tabs = TestBed.inject(ContentTabsService);
    paneTree = TestBed.inject(PaneTreeService);
    router = TestBed.inject(Router);
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/');
    tabs.open({ path: 'doc/a', title: 'A', titleIsLiteral: true, badge: DRAFT });
    tabs.open({ path: 'doc/b', title: 'B', titleIsLiteral: true });
    await settle();
  });

  it('changes a tab behind another, and the tab in front and the address stay', async () => {
    tabs.update('doc/a', { badge: SENT }, 'docs');
    await settle();

    expect(stored('doc/a')?.badge).toEqual(SENT);
    expect(router.url).toBe('/doc/b');
    expect(findLeaf(paneTree.tree(CONTENT_DOCK), PRIMARY_PANE)?.active).toBe(
      'doc/b',
    );
  });

  it('keeps what the change leaves out', () => {
    tabs.update('doc/a', { badge: SENT }, 'docs');

    expect(stored('doc/a')).toMatchObject({
      title: 'A',
      literalTitle: true,
      badge: SENT,
    });
  });

  it('takes the badge away with null', () => {
    tabs.update('doc/a', { badge: null }, 'docs');

    expect(stored('doc/a')).not.toHaveProperty('badge');
    expect(stored('doc/a')?.title).toBe('A');
  });

  it('makes a title given without the literal flag a key again', () => {
    tabs.update('doc/a', { title: 'docs.titles.a' }, 'docs');

    expect(stored('doc/a')?.title).toBe('docs.titles.a');
    expect(stored('doc/a')).not.toHaveProperty('literalTitle');
  });

  it('changes a tab that stands in another pane, where it stands', () => {
    paneTree.splitPane(CONTENT_DOCK, PRIMARY_PANE, 'row', 'doc/x');

    tabs.update('doc/x', { title: 'X', titleIsLiteral: true }, 'docs');

    const holder = paneTree.sourceOf('doc/x');
    expect(holder?.paneId).not.toBe(PRIMARY_PANE);
    expect(stored('doc/x')?.title).toBe('X');
  });

  it('keeps the change across a restart', () => {
    tabs.update('doc/a', { badge: SENT }, 'docs');

    expect(localStorage.getItem('lw.shell.pane-trees:default')).toContain(
      '"text":"Sent"',
    );
  });

  it('keeps a badge given to a tab whose title the workbench worked out', async () => {
    await harness.navigateByUrl('/doc/c');
    await settle();
    expect(stored('doc/c')).not.toHaveProperty('title');

    tabs.update('doc/c', { badge: SENT }, 'docs');
    tabs.open({ path: 'doc/d', title: 'D', titleIsLiteral: true });
    await settle();

    expect(stored('doc/c')?.badge).toEqual(SENT);
  });

  it('opens nothing for content with no open tab', () => {
    const before = collectTabs(paneTree.tree(CONTENT_DOCK));

    tabs.update('doc/zzz', { badge: SENT }, 'docs');

    expect(collectTabs(paneTree.tree(CONTENT_DOCK))).toEqual(before);
  });

  it("leaves another plugin's tab alone", () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    tabs.update('doc/a', { badge: SENT }, 'notes');

    expect(stored('doc/a')?.badge).toEqual(DRAFT);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"notes"'));
    warn.mockRestore();
  });
});

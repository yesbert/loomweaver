import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ContentRoute } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { PRIMARY_PANE } from '../../pane/tree/pane-address';
import { PaneTreeService } from '../../pane/tree/pane-tree.service';
import { buildContentRoutes } from '../routing/content-router';
import { ContentTabsService } from './content-tabs.service';

@Component({ selector: 'lw-test-content', template: '' })
class TestContent {}

const ROUTES: readonly ContentRoute[] = [
  { path: '', component: TestContent },
  { path: 'doc/:id', component: TestContent, id: 'testbed.doc' },
];

async function setUp() {
  localStorage.clear();
  TestBed.configureTestingModule({
    providers: [provideRouter(buildContentRoutes(ROUTES))],
  });
  const registry = TestBed.inject(ContributionRegistry);
  for (const route of ROUTES) registry.addContentRoute(route);
  const service = TestBed.inject(ContentTabsService);
  const harness = await RouterTestingHarness.create();
  return { service, harness, registry };
}

describe('View tabs in the pane that carries the address', () => {
  let service: ContentTabsService;
  let paneTree: PaneTreeService;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    let registry: ContributionRegistry;
    ({ service, harness, registry } = await setUp());
    registry.addView({
      id: 'outline',
      region: 'primary',
      title: 'outline.title',
      component: TestContent,
    });
    paneTree = TestBed.inject(PaneTreeService);
    await harness.navigateByUrl('/');
  });

  it('draws a held view tab after the opened tabs and activates it without navigating', async () => {
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

  it('ends the view tab selection on a navigation, so the address takes the area back', async () => {
    paneTree.seedPrimaryTabs('content', ['view:outline']);
    service.activateViewTab('view:outline');

    await harness.navigateByUrl('/doc/a');

    expect(service.activeViewPath()).toBeNull();
  });

  it('closing a view tab removes it and ends its selection', () => {
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

  it('opening and closing content tabs leaves the view tabs untouched', () => {
    paneTree.seedPrimaryTabs('content', ['view:outline']);

    service.open({ path: 'doc/a', title: 'A.ts', titleIsLiteral: true });
    service.close('doc/a');

    expect(paneTree.primaryTabs('content').map((tab) => tab.path)).toContain(
      'view:outline',
    );
  });

  it('ignores activating a view tab the pane does not hold', () => {
    service.activateViewTab('view:outline');
    expect(service.activeViewPath()).toBeNull();
  });

  it('keeps a selection made after its own navigation settles', async () => {
    paneTree.seedPrimaryTabs('content', ['view:outline']);

    await service.navigate('doc/a');
    service.activateViewTab('view:outline');
    TestBed.tick();

    expect(service.activeViewPath()).toBe('view:outline');
  });

  it('closing the pane that carries the address onto a view-only neighbour keeps that view shown', async () => {
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

  it('closing the pane that carries the address hands a tab that cannot close to the neighbour', async () => {
    paneTree.commit('content', {
      kind: 'split',
      id: 'root',
      orientation: 'row',
      ratio: 0.5,
      first: {
        kind: 'leaf',
        id: PRIMARY_PANE,
        tabs: [{ path: 'doc/fixed', closable: false }, { path: 'doc/a' }],
        active: 'doc/a',
      },
      second: {
        kind: 'leaf',
        id: 'other',
        tabs: [{ path: 'view:outline' }],
        active: 'view:outline',
      },
    });

    service.closePrimaryPane();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(paneTree.isSplit('content')).toBe(false);
    expect(paneTree.primaryTabs('content').map((tab) => tab.path)).toEqual([
      'view:outline',
      'doc/fixed',
    ]);
  });
});

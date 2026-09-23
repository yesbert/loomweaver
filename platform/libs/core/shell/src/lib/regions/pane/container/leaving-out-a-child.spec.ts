import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ContainerSpec } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { CONTAINER_CHILD_REGION } from '../../../plugin/surface-normalize';
import { MenuService } from '../../../menu/menu.service';
import { PaneTargetPicker } from '../../content/pane-target-picker.service';
import { ContentTabsService } from '../../content/tabs/content-tabs.service';
import { PaneMoveService } from '../drag/pane-move.service';
import { PaneActions } from '../pane-actions.service';
import { PaneLeaf, PaneNode, PaneSplit } from '../tree/pane-node';
import { collectLeafIds, findLeaf } from '../tree/pane-queries';
import { PaneTreeService } from '../tree/pane-tree.service';
import { containerDockFor } from './container-children';
import { ContainerPaneHost } from './container-pane-host';
import { LeftOutChildren, shownTree } from './left-out-children';
import { PaneContainersService } from './pane-containers.service';

@Component({ selector: 'lw-test-child', template: '' })
class TestChild {}

const SPEC: ContainerSpec = {
  children: [
    { surface: 't.a', segment: 'a' },
    { surface: 't.b', segment: 'b' },
    { surface: 't.c', segment: 'c' },
  ],
  initial: ['t.a', 't.b', 't.c'],
};

const DOCK = containerDockFor('box');

function leaf(id: string, paths: readonly string[], active?: string): PaneLeaf {
  return {
    kind: 'leaf',
    id,
    tabs: paths.map((path) => ({ path })),
    ...(active !== undefined && { active }),
  };
}

function split(first: PaneNode, second: PaneNode): PaneSplit {
  return {
    kind: 'split',
    id: 's',
    orientation: 'row',
    ratio: 0.5,
    first,
    second,
  };
}

const hiding =
  (...paths: string[]) =>
  (path: string) =>
    paths.includes(path);

describe('the tree a container draws, with children left out', () => {
  it('draws the shown tabs of a pane and nothing in place of the one left out', () => {
    const drawn = shownTree(
      leaf('p', ['box/a', 'box/b', 'box/c'], 'box/b'),
      hiding('box/b'),
    );

    expect(drawn).toEqual(leaf('p', ['box/a', 'box/c'], 'box/a'));
  });

  it('keeps the active tab where it is shown', () => {
    const drawn = shownTree(
      leaf('p', ['box/a', 'box/b', 'box/c'], 'box/c'),
      hiding('box/a'),
    );

    expect((drawn as PaneLeaf).active).toBe('box/c');
  });

  it('draws no pane whose every child is left out, and the pane beside it takes the room', () => {
    const drawn = shownTree(
      split(leaf('p', ['box/a']), leaf('q', ['box/b', 'box/c'])),
      hiding('box/a'),
    );

    expect(drawn).toEqual(leaf('q', ['box/b', 'box/c']));
  });

  it('keeps a pane the container declared empty', () => {
    const empty: PaneLeaf = { kind: 'leaf', id: 'e', tabs: [], declared: true };

    expect(shownTree(empty, hiding('box/a'))).toBe(empty);
  });

  it('draws the stored tree itself while nothing is left out', () => {
    const tree = split(leaf('p', ['box/a']), leaf('q', ['box/b']));

    expect(shownTree(tree, () => false)).toBe(tree);
  });
});

describe('a container with a child left out', () => {
  let harness: RouterTestingHarness;
  let router: Router;
  let paneTree: PaneTreeService;
  let leftOut: LeftOutChildren;

  const storedPaths = () =>
    (
      findLeaf(paneTree.tree(DOCK), collectLeafIds(paneTree.tree(DOCK))[0])
        ?.tabs ?? []
    ).map((tab) => tab.path);
  const drawnTabs = () =>
    Array.from(
      (harness.routeNativeElement as HTMLElement).querySelectorAll(
        '[role="tab"]',
      ),
      (tab) => tab.getAttribute('aria-label') ?? tab.textContent?.trim(),
    );

  async function settle(): Promise<void> {
    for (let turn = 0; turn < 3; turn += 1) {
      await harness.fixture.whenStable();
      harness.detectChanges();
    }
  }

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestingModule.forRoot({
          langs: {
            en: { t: { a: 'Alpha', b: 'Beta', c: 'Gamma', d: 'Delta' } },
          },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
          preloadLangs: true,
        }),
      ],
      providers: [
        provideRouter([
          {
            path: 'box',
            component: ContainerPaneHost,
            data: { container: SPEC },
            children: ['', 'a', 'b', 'c'].map((path) => ({
              path,
              pathMatch: 'full' as const,
              component: TestChild,
            })),
          },
        ]),
      ],
    });
    const registry = TestBed.inject(ContributionRegistry);
    registry.addContentRoute({
      id: 'box',
      path: 'box',
      container: SPEC,
    });
    for (const id of ['t.a', 't.b', 't.c']) {
      registry.addView({
        id,
        title: id,
        region: CONTAINER_CHILD_REGION,
        component: TestChild,
      });
    }
    paneTree = TestBed.inject(PaneTreeService);
    leftOut = TestBed.inject(LeftOutChildren);
    router = TestBed.inject(Router);
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/box/a');
    await settle();
  });

  it('draws two tabs, and nothing stands in for the third', async () => {
    leftOut.setShown('t.b', false);
    await settle();

    expect(drawnTabs()).toEqual(['Alpha', 'Gamma']);
  });

  it('brought back, stands where it stood, with the others where the person left them', async () => {
    leftOut.setShown('t.b', false);
    await settle();
    paneTree.reorderPaneTabs(DOCK, collectLeafIds(paneTree.tree(DOCK))[0], [
      'box/c',
      'box/a',
    ]);
    await settle();

    leftOut.setShown('t.b', true);
    await settle();

    expect(storedPaths()).toEqual(['box/c', 'box/a', 'box/b']);
    expect(drawnTabs()).toEqual(['Gamma', 'Alpha', 'Beta']);
  });

  it('hands the focus of a child left out to one shown beside it, and the address follows', async () => {
    leftOut.setShown('t.a', false);
    await settle();

    expect(router.url).toBe('/box/b');
  });

  it('opens an address naming a child left out on a child shown, and names that one', async () => {
    leftOut.setShown('t.c', false);
    await settle();

    await harness.navigateByUrl('/box/c');
    await settle();

    expect(router.url).toBe('/box/a');
    expect(drawnTabs()).toEqual(['Alpha', 'Beta']);
  });

  it('does not open a child left out on request', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    leftOut.setShown('t.c', false);

    TestBed.inject(PaneContainersService).openContainerChild(DOCK, SPEC, 'c');
    await settle();

    expect(router.url).toBe('/box/a');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"c"'));
    warn.mockRestore();
  });

  it('is not offered by the picker for a pane of the container', () => {
    leftOut.setShown('t.b', false);
    const openList = vi
      .spyOn(TestBed.inject(MenuService), 'openList')
      .mockImplementation(() => undefined);

    TestBed.inject(PaneTargetPicker).openForChildren(
      document.createElement('button'),
      SPEC,
      () => undefined,
    );

    const offered = openList.mock.calls[0][0].map((entry) => entry.key);
    expect(offered).toEqual(['view:t.a', 'view:t.c']);
  });

  it('is not closed by closing all the tabs of its pane', async () => {
    leftOut.setShown('t.b', false);
    const paneId = collectLeafIds(paneTree.tree(DOCK))[0];

    TestBed.inject(ContentTabsService).closeAll({ dock: DOCK, paneId });
    await settle();

    expect(storedPaths()).toEqual(['box/b']);
  });

  it('is not closed with the pane that holds it, but handed to the pane beside it', () => {
    const tab = (path: string) => ({ path, instance: `${DOCK}::${path}` });
    paneTree.commit(
      DOCK,
      split(
        { kind: 'leaf', id: 'p', tabs: [tab('box/a'), tab('box/b')] },
        { kind: 'leaf', id: 'q', tabs: [tab('box/c')] },
      ),
      'q',
    );
    leftOut.setShown('t.a', false);

    TestBed.inject(PaneActions).close(DOCK, 'p');

    expect(
      findLeaf(paneTree.tree(DOCK), 'q')?.tabs.map((kept) => kept.path),
    ).toEqual(['box/c', 'box/a']);
  });

  it('does not shift a tab dropped beside it', () => {
    const tab = (path: string) => ({ path, instance: `${DOCK}::${path}` });
    paneTree.commit(
      DOCK,
      split(
        { kind: 'leaf', id: 'p', tabs: [tab('box/a'), tab('box/b')] },
        { kind: 'leaf', id: 'q', tabs: [tab('box/c')] },
      ),
      'p',
    );
    leftOut.setShown('t.a', false);

    TestBed.inject(PaneMoveService).moveToStrip(
      { dock: DOCK, paneId: 'q' },
      'box/c',
      { dock: DOCK, paneId: 'p' },
      1,
    );

    expect(
      findLeaf(paneTree.tree(DOCK), 'p')?.tabs.map((moved) => moved.path),
    ).toEqual(['box/a', 'box/b', 'box/c']);
  });

  it('wins over the padlock: a child the session does not qualify for draws neither tab nor placeholder', async () => {
    const registry = TestBed.inject(ContributionRegistry);
    registry.addView({
      id: 't.d',
      title: 't.d',
      region: CONTAINER_CHILD_REGION,
      component: TestChild,
      access: { anyRole: ['admin'] },
    });
    TestBed.inject(PaneContainersService).insertContainerChild(
      DOCK,
      { ...SPEC, children: [...(SPEC.children ?? []), 't.d'] },
      collectLeafIds(paneTree.tree(DOCK))[0],
      't.d',
    );
    leftOut.setShown('t.d', false);
    await settle();

    expect(drawnTabs()).toEqual(['Alpha', 'Beta', 'Gamma']);
    expect(
      (harness.routeNativeElement as HTMLElement).querySelector(
        'lw-auth-required',
      ),
    ).toBeNull();
  });
});

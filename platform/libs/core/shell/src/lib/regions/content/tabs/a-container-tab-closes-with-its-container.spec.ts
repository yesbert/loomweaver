import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ContainerSpec } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../../contributions/contribution-registry';
import { ContainerDockGc } from '../../pane/container/container-dock-gc';
import { containerDockFor } from '../../pane/container/container-children';
import { PaneContainersService } from '../../pane/container/pane-containers.service';
import { CONTENT_DOCK } from '../../pane/tree/pane-address';
import { collectTabPaths } from '../../pane/tree/pane-queries';
import { PaneTreeService } from '../../pane/tree/pane-tree.service';
import { TabCloseHooks } from './tab-close-hooks';

@Component({ selector: 'lw-test-doc', template: '' })
class TestDoc {}

const BOARD: ContainerSpec = {
  children: [{ surface: 'notes', segment: 'notes' }],
  initial: ['notes'],
};

const BOARD_DOCK = containerDockFor('board');

describe('a container tab with a teardown', () => {
  let paneTree: PaneTreeService;
  let hooks: TabCloseHooks;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: { url: '/elsewhere' } }],
    });
    const registry = TestBed.inject(ContributionRegistry);
    registry.addContentRoute({ id: 'board', path: 'board', container: BOARD });
    registry.addContentRoute({ path: 'doc/:id', component: TestDoc });
    paneTree = TestBed.inject(PaneTreeService);
    hooks = TestBed.inject(TabCloseHooks);
    TestBed.inject(PaneContainersService).ensureContainer(BOARD_DOCK, BOARD);
    paneTree.seedPrimaryTabs(CONTENT_DOCK, ['board', 'elsewhere']);
    TestBed.inject(ContainerDockGc).start();
    TestBed.tick();
  });

  function closeBoardTab(): void {
    paneTree.removeTab(CONTENT_DOCK, paneTree.primaryId(CONTENT_DOCK), 'board');
    TestBed.tick();
  }

  it('runs once when its tab is closed, though its own container still holds its children', () => {
    const onClose = vi.fn();
    hooks.set('board', onClose);
    expect(collectTabPaths(paneTree.tree(BOARD_DOCK))).toContain('board/notes');

    closeBoardTab();

    expect(paneTree.hasDock(BOARD_DOCK)).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('runs for a content tab dragged into the container once the container goes', () => {
    const onClose = vi.fn();
    hooks.set('doc/a', onClose);
    paneTree.insertTab(BOARD_DOCK, paneTree.landingPane(BOARD_DOCK), 'doc/a');
    expect(onClose).not.toHaveBeenCalled();

    closeBoardTab();

    expect(paneTree.hasTab('doc/a')).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not run while the container tab stays open', () => {
    const onClose = vi.fn();
    hooks.set('board', onClose);

    paneTree.removeTab(
      BOARD_DOCK,
      paneTree.landingPane(BOARD_DOCK),
      'board/notes',
    );
    TestBed.tick();

    expect(onClose).not.toHaveBeenCalled();
  });
});

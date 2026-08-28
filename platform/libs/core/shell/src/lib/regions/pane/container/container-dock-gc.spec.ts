import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ContainerDockGc } from './container-dock-gc';
import { containerDockFor } from './container-children';
import { CONTENT_DOCK } from '../tree/pane-address';
import { PaneTreeService } from '../tree/pane-tree.service';
import { PaneContainersService } from './pane-containers.service';

describe('ContainerDockGc', () => {
  const routerStub = { url: '/' };

  beforeEach(() => {
    localStorage.clear();
    routerStub.url = '/';
    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: routerStub }],
    });
  });

  it('keeps a container dock whose tab is open in the content dock and drops an orphaned one', () => {
    const paneTree = TestBed.inject(PaneTreeService);
    const containers = TestBed.inject(PaneContainersService);
    containers.ensureContainer(containerDockFor('workspace/alpha'), {
      children: ['a'],
      initial: ['a'],
    });
    containers.ensureContainer(containerDockFor('workspace/beta'), {
      children: ['a'],
      initial: ['a'],
    });
    paneTree.seedPrimaryTabs(CONTENT_DOCK, ['workspace/alpha']);

    TestBed.inject(ContainerDockGc).start();
    TestBed.tick();

    const trees = paneTree.dockTrees();
    expect(trees[containerDockFor('workspace/alpha')]).toBeDefined();
    expect(trees[containerDockFor('workspace/beta')]).toBeUndefined();
  });

  it('keeps a container dock whose tab moved into a sidebar (the tree travels with the tab)', () => {
    const paneTree = TestBed.inject(PaneTreeService);
    const containers = TestBed.inject(PaneContainersService);
    containers.ensureContainer(containerDockFor('workspace/alpha'), {
      children: ['a'],
      initial: ['a'],
    });
    paneTree.seedPrimaryTabs('primary', ['workspace/alpha']);

    TestBed.inject(ContainerDockGc).start();
    TestBed.tick();

    expect(
      paneTree.dockTrees()[containerDockFor('workspace/alpha')],
    ).toBeDefined();
  });

  it('keeps the container dock of the active content route while its tab is not yet reconciled (LWF-03)', () => {
    routerStub.url = '/runs/1';
    const paneTree = TestBed.inject(PaneTreeService);
    const containers = TestBed.inject(PaneContainersService);
    containers.ensureContainer(containerDockFor('runs/1'), {
      children: ['a'],
      initial: ['a'],
    });

    TestBed.inject(ContainerDockGc).start();
    TestBed.tick();

    expect(paneTree.dockTrees()[containerDockFor('runs/1')]).toBeDefined();
  });
});

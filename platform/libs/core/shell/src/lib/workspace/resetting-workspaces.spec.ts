import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideLayout } from '../layout/layout';
import { WorkspaceService } from './workspace.service';
import { provideWorkspaces } from './declaration/provide-workspaces';
import { UNUSABLE_WORKSPACES } from './usability/unusable-workspaces';
import { UnusableWorkspacesService } from './usability/unusable-workspaces.service';

import { TabCloseHooks } from '../regions/content/tabs/tab-close-hooks';
import { CONTENT_DOCK } from '../regions/pane/tree/pane-address';
import { PaneTreeService } from '../regions/pane/tree/pane-tree.service';

const LAYOUT = {
  regions: [
    { id: 'main', type: 'content', dock: 'center' },
    { id: 'right-panel', type: 'panel', dock: 'right' },
  ],
} as const;

const REARRANGED = JSON.stringify({
  content: {
    tree: {
      kind: 'leaf',
      id: 'main',
      tabs: [{ path: 'orders/o-1' }],
      active: 'orders/o-1',
    },
    primary: 'main',
  },
});

const WITHOUT_CONTENT = JSON.stringify({
  'right-panel': {
    tree: {
      kind: 'leaf',
      id: 'main',
      tabs: [{ path: 'view:agent.chat' }],
      active: 'view:agent.chat',
    },
    primary: 'main',
  },
});

async function opened(): Promise<WorkspaceService> {
  const ws = compose();
  for (let turn = 0; turn < 4; turn += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  return ws;
}

function unusableIds(): ReadonlySet<string> {
  return TestBed.inject(UNUSABLE_WORKSPACES).ids();
}

function compose(): WorkspaceService {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: '**', children: [] }]),
      provideLayout(LAYOUT as never),
      provideWorkspaces({ id: 'overview', title: 'Overview', initial: true }, {
        id: 'orders',
        title: 'Orders',
        claims: ['orders/:id'],
        content: { tabs: [{ path: 'orders/o-0', closable: false }] },
      } as never),
      { provide: UNUSABLE_WORKSPACES, useExisting: UnusableWorkspacesService },
    ],
  });
  return TestBed.inject(WorkspaceService);
}

function storedOrders(): string {
  return localStorage.getItem('lw.shell.pane-trees:orders') ?? '';
}

describe('resetting a workspace', () => {
  beforeEach(() => localStorage.clear());

  it('acts on the workspace it names, leaving the user where they are', async () => {
    localStorage.setItem('lw.shell.pane-trees:orders', REARRANGED);
    const ws = compose();
    expect(ws.activeId()).toBe('overview');

    await ws.reset('orders');

    expect(ws.activeId()).toBe('overview');
    expect(storedOrders()).not.toContain('orders/o-1');
    expect(storedOrders()).toContain('orders/o-0');
  });

  it('acts on the active workspace where none is named', async () => {
    const ws = compose();
    await ws.switchTo('orders');
    localStorage.setItem('lw.shell.pane-trees:orders', REARRANGED);

    await ws.reset();

    expect(ws.activeId()).toBe('orders');
    expect(storedOrders()).toContain('orders/o-0');
  });

  it('does nothing for a workspace nobody declared or saved', async () => {
    localStorage.setItem('lw.shell.pane-trees:orders', REARRANGED);
    const ws = compose();

    await ws.reset('nothing-here');

    expect(storedOrders()).toContain('orders/o-1');
  });

  it('returns every workspace to its baseline when asked for all of them', async () => {
    localStorage.setItem('lw.shell.pane-trees:orders', REARRANGED);
    const ws = compose();

    await ws.resetAll();

    expect(storedOrders()).toContain('orders/o-0');
    expect(storedOrders()).not.toContain('orders/o-1');
  });

  it('closes the tabs a reset of the active workspace removes, so their teardown runs once, and a switch only parks them', async () => {
    const ws = compose();
    await ws.switchTo('orders');
    const paneTree = TestBed.inject(PaneTreeService);
    const hooks = TestBed.inject(TabCloseHooks);
    const removed = vi.fn();
    const kept = vi.fn();
    paneTree.insertTab(
      CONTENT_DOCK,
      paneTree.primaryId(CONTENT_DOCK),
      'orders/o-1',
    );
    hooks.set('orders/o-1', removed);
    hooks.set('orders/o-0', kept);

    await ws.switchTo('overview');
    await ws.switchTo('orders');
    expect(removed).not.toHaveBeenCalled();

    await ws.reset();

    expect(paneTree.hasTab('orders/o-1')).toBe(false);
    expect(removed).toHaveBeenCalledTimes(1);
    expect(kept).not.toHaveBeenCalled();
  });
});

describe('the marks of a workspace the user is not in', () => {
  beforeEach(() => localStorage.clear());

  it('the changed mark is cleared at once by a reset that names the workspace', async () => {
    localStorage.setItem('lw.shell.pane-trees:orders', REARRANGED);
    const ws = await opened();
    expect(ws.changedIds().has('orders')).toBe(true);

    await ws.reset('orders');

    expect(ws.changedIds().has('orders')).toBe(false);
  });

  it('the changed mark is cleared at once by a reset of every workspace that leaves the active one as it was', async () => {
    localStorage.setItem('lw.shell.pane-trees:orders', REARRANGED);
    const ws = await opened();
    expect(ws.changedIds().has('overview')).toBe(false);
    expect(ws.changedIds().has('orders')).toBe(true);

    await ws.resetAll();

    expect(ws.activeId()).toBe('overview');
    expect(ws.changedIds().size).toBe(0);
  });

  it('the unusable mark is cleared at once by a reset that names the workspace', async () => {
    localStorage.setItem('lw.shell.pane-trees:orders', WITHOUT_CONTENT);
    const ws = await opened();
    expect(unusableIds().has('orders')).toBe(true);

    await ws.reset('orders');

    expect(unusableIds().has('orders')).toBe(false);
  });

  it('the unusable mark is cleared at once by a reset of every workspace that leaves the active one as it was', async () => {
    localStorage.setItem('lw.shell.pane-trees:orders', WITHOUT_CONTENT);
    const ws = await opened();
    expect(unusableIds().has('orders')).toBe(true);

    await ws.resetAll();

    expect(ws.activeId()).toBe('overview');
    expect(unusableIds().size).toBe(0);
  });
});

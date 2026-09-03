import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideLayout } from '../layout/layout';
import { WorkspaceService } from './workspace.service';
import { provideWorkspaces } from './provide-workspaces';

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
});

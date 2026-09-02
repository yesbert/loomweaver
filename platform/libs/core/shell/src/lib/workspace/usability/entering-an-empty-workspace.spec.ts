import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideLayout } from '../../layout/layout';
import { WorkspaceService } from '../workspace.service';
import { UnusableWorkspacesService } from './unusable-workspaces.service';
import {
  provideWorkspaces,
  withoutUnusableWorkspaceNotice,
} from '../provide-workspaces';

const LAYOUT = {
  regions: [
    { id: 'main', type: 'content', dock: 'center' },
    { id: 'right-panel', type: 'panel', dock: 'right' },
  ],
} as const;

const DASHBOARD = {
  id: 'dashboard',
  title: 'Dashboard',
  initial: true,
  claims: [''],
} as const;

const PAYMENTS = {
  id: 'payments',
  title: 'Payments',
  claims: ['payments'],
  content: { tabs: [{ path: 'payments', closable: false }] },
} as const;

const PANEL_ONLY_AS_FOUND_IN_A_REAL_PROFILE = JSON.stringify({
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

function compose(silent = false): {
  ws: WorkspaceService;
  unusable: UnusableWorkspacesService;
} {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: '**', children: [] }]),
      provideLayout(LAYOUT as never),
      provideWorkspaces(
        DASHBOARD as never,
        PAYMENTS as never,
        ...(silent ? [withoutUnusableWorkspaceNotice()] : []),
      ),
    ],
  });
  return {
    ws: TestBed.inject(WorkspaceService),
    unusable: TestBed.inject(UnusableWorkspacesService),
  };
}

describe('a workspace whose stored arrangement leaves it without content', () => {
  beforeEach(() => localStorage.clear());

  it('is entered rather than exchanged for the workspace claiming the home address', async () => {
    localStorage.setItem('lw.shell.pane-trees:payments', PANEL_ONLY_AS_FOUND_IN_A_REAL_PROFILE);

    const { ws } = compose();
    await ws.switchTo('payments');
    await ws.settle('');

    expect(ws.activeId()).toBe('payments');
  });

  it('is named as one that cannot work as declared', async () => {
    localStorage.setItem('lw.shell.pane-trees:payments', PANEL_ONLY_AS_FOUND_IN_A_REAL_PROFILE);

    const { ws, unusable } = compose();
    await ws.switchTo('payments');

    expect(unusable.ids().has('payments')).toBe(true);
  });

  it('is not named where its declared content is the starting address itself', async () => {
    const home = {
      id: 'home',
      title: 'Home',
      initial: true,
      claims: [''],
      content: { tabs: [{ path: '', closable: false }] },
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        provideLayout(LAYOUT as never),
        provideWorkspaces(home as never, PAYMENTS as never),
      ],
    });
    const ws = TestBed.inject(WorkspaceService);
    const unusable = TestBed.inject(UnusableWorkspacesService);
    await ws.switchTo('home');

    expect(unusable.ids().has('home')).toBe(false);
  });

  it('is not named where the stored arrangement still holds its content', async () => {
    const { ws, unusable } = compose();
    await ws.switchTo('payments');

    expect(unusable.ids().has('payments')).toBe(false);
  });

  it('is repaired by a reset that names it, without moving the user', async () => {
    localStorage.setItem('lw.shell.pane-trees:payments', PANEL_ONLY_AS_FOUND_IN_A_REAL_PROFILE);

    const { ws, unusable } = compose();
    expect(ws.activeId()).toBe('dashboard');

    ws.reset('payments');

    expect(ws.activeId()).toBe('dashboard');
    expect(unusable.ids().has('payments')).toBe(false);
  });

  it('is announced unless the product asked otherwise', async () => {
    expect(compose().unusable.announces).toBe(true);
  });

  it('is still entered and still readable where the product asked for silence', async () => {
    localStorage.setItem('lw.shell.pane-trees:payments', PANEL_ONLY_AS_FOUND_IN_A_REAL_PROFILE);

    const { ws, unusable } = compose(true);
    await ws.switchTo('payments');
    await ws.settle('');

    expect(unusable.announces).toBe(false);
    expect(ws.activeId()).toBe('payments');
    expect(unusable.ids().has('payments')).toBe(true);
  });
});

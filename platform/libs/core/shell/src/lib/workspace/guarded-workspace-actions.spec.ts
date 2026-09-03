import { inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FeatureSwitches } from '../features/feature-switches.service';
import {
  APP_RESET_WORKSPACES,
  AppResetService,
} from '../regions/reset/app-reset.service';
import { provideLayout } from '../layout/layout';
import { SurfaceCloseGuard } from '../regions/pane/close/surface-close-guard';
import { RetainedViewStash } from '../regions/pane/retention/retained-view-stash';
import { RetentionCandidates } from '../regions/pane/retention/retention-candidates';
import { PanelState } from '../regions/panel/panel-state';
import { CONTENT_DOCK } from '../regions/pane/tree/pane-address';
import { PaneTreeService } from '../regions/pane/tree/pane-tree.service';
import { provideWorkspaces } from './provide-workspaces';
import { WorkspaceService } from './workspace.service';

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

function compose(answer = true) {
  localStorage.clear();
  const guard = { confirmDiscard: vi.fn(async () => answer) };
  const dirty = { surfaceDirty: () => true };
  const retention = { all: vi.fn(() => [dirty]) };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: '**', children: [] }]),
      provideLayout(LAYOUT as never),
      provideWorkspaces({ id: 'overview', title: 'Overview', initial: true }, {
        id: 'orders',
        title: 'Orders',
        content: { tabs: [{ path: 'orders/o-0', closable: false }] },
      } as never),
      { provide: SurfaceCloseGuard, useValue: guard },
      { provide: RetentionCandidates, useValue: retention },
      {
        provide: APP_RESET_WORKSPACES,
        useFactory: () => {
          const workspaces = inject(WorkspaceService);
          return () => workspaces.resetAll();
        },
      },
    ],
  });
  return { ws: TestBed.inject(WorkspaceService), guard, retention, dirty };
}

async function settled(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function arrangement(): string {
  return JSON.stringify(TestBed.inject(PaneTreeService).tree(CONTENT_DOCK));
}

function stored(workspaceId: string): string {
  return localStorage.getItem(`lw.shell.pane-trees:${workspaceId}`) ?? '';
}

describe('WorkspaceService asks about unsaved work where the command did', () => {
  it('resetting the active workspace asks with all retained work and reports that it ran', async () => {
    localStorage.setItem('lw.shell.pane-trees:overview', REARRANGED);
    const { ws, guard, dirty } = compose();

    const ran = await ws.reset();

    expect(ran).toBe(true);
    expect(guard.confirmDiscard).toHaveBeenCalledWith([dirty]);
    expect(stored('overview')).not.toContain('orders/o-1');
  });

  it('a declined reset reports so and changes nothing', async () => {
    const { ws } = compose(false);
    await settled();
    TestBed.inject(PaneTreeService).insertTab(
      CONTENT_DOCK,
      'main',
      'orders/o-1',
    );
    const before = arrangement();

    const ran = await ws.reset();

    expect(ran).toBe(false);
    expect(arrangement()).toBe(before);
    expect(before).toContain('orders/o-1');
  });

  it('resetting a workspace the user is not in asks nothing', async () => {
    localStorage.setItem('lw.shell.pane-trees:orders', REARRANGED);
    const { ws, guard } = compose();

    const ran = await ws.reset('orders');

    expect(ran).toBe(true);
    expect(guard.confirmDiscard).not.toHaveBeenCalled();
    expect(stored('orders')).not.toContain('orders/o-1');
  });

  it('resetAll asks once for every workspace', async () => {
    localStorage.setItem('lw.shell.pane-trees:overview', REARRANGED);
    localStorage.setItem('lw.shell.pane-trees:orders', REARRANGED);
    const { ws, guard } = compose();

    const ran = await ws.resetAll();

    expect(ran).toBe(true);
    expect(guard.confirmDiscard).toHaveBeenCalledTimes(1);
    expect(stored('overview')).not.toContain('orders/o-1');
    expect(stored('orders')).not.toContain('orders/o-1');
  });

  it('removing a workspace asks for the work parked under it', async () => {
    const { ws, guard } = compose(false);
    await ws.saveCurrent('scratch');
    const saved = ws.workspaces().find((w) => w.name === 'scratch');
    if (!saved) {
      throw new Error('no saved workspace');
    }
    const parked = { surfaceDirty: () => true };
    vi.spyOn(
      TestBed.inject(RetainedViewStash),
      'parkedInstancesOf',
    ).mockReturnValue([parked]);

    const ran = await ws.remove(saved.id);

    expect(ran).toBe(false);
    expect(guard.confirmDiscard).toHaveBeenLastCalledWith([parked]);
    expect(ws.workspaces().some((w) => w.id === saved.id)).toBe(true);
  });

  it('removing a workspace with nothing parked asks with no candidates and removes it', async () => {
    const { ws, guard } = compose();
    await ws.saveCurrent('scratch');
    const saved = ws.workspaces().find((w) => w.name === 'scratch');
    if (!saved) {
      throw new Error('no saved workspace');
    }

    const ran = await ws.remove(saved.id);

    expect(ran).toBe(true);
    expect(guard.confirmDiscard).toHaveBeenLastCalledWith([]);
    expect(ws.workspaces().some((w) => w.id === saved.id)).toBe(false);
  });
});

describe('AppResetService asks about unsaved work where the command did', () => {
  it('asks and reports, and resets the frame when allowed', async () => {
    const { guard } = compose();
    const panels = TestBed.inject(PanelState);
    panels.toggle('right-panel');
    expect(panels.isCollapsed('right-panel')).toBe(true);

    const ran = await TestBed.inject(AppResetService).reset();

    expect(ran).toBe(true);
    expect(guard.confirmDiscard).toHaveBeenCalledTimes(1);
    expect(panels.isCollapsed('right-panel')).toBe(false);
  });

  it('a declined reset leaves the frame alone', async () => {
    compose(false);
    const panels = TestBed.inject(PanelState);
    panels.toggle('right-panel');

    const ran = await TestBed.inject(AppResetService).reset();

    expect(ran).toBe(false);
    expect(panels.isCollapsed('right-panel')).toBe(true);
  });

  it('including the workspaces asks once and resets both', async () => {
    localStorage.setItem('lw.shell.pane-trees:overview', REARRANGED);
    const { guard } = compose();
    const panels = TestBed.inject(PanelState);
    panels.toggle('right-panel');

    const ran = await TestBed.inject(AppResetService).reset({
      workspaces: true,
    });

    expect(ran).toBe(true);
    expect(guard.confirmDiscard).toHaveBeenCalledTimes(1);
    expect(stored('overview')).not.toContain('orders/o-1');
    expect(panels.isCollapsed('right-panel')).toBe(false);
  });

  it('declining once resets neither', async () => {
    const { guard } = compose(false);
    await settled();
    TestBed.inject(PaneTreeService).insertTab(
      CONTENT_DOCK,
      'main',
      'orders/o-1',
    );
    const before = arrangement();
    const panels = TestBed.inject(PanelState);
    panels.toggle('right-panel');

    const ran = await TestBed.inject(AppResetService).reset({
      workspaces: true,
    });

    expect(ran).toBe(false);
    expect(guard.confirmDiscard).toHaveBeenCalledTimes(1);
    expect(arrangement()).toBe(before);
    expect(panels.isCollapsed('right-panel')).toBe(true);
  });
});

describe('Workspaces stay reachable while switched off', () => {
  it('switchTo and reset work with workspaces.enabled off', async () => {
    localStorage.setItem('lw.shell.pane-trees:orders', REARRANGED);
    const { ws } = compose();
    TestBed.inject(FeatureSwitches).update({ workspaces: { enabled: false } });

    await ws.switchTo('orders');
    expect(ws.activeId()).toBe('orders');

    const ran = await ws.reset();
    expect(ran).toBe(true);
    expect(stored('orders')).not.toContain('orders/o-1');
  });
});

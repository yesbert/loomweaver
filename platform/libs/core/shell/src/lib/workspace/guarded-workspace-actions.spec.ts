import {
  Component,
  ComponentRef,
  createComponent,
  EmbeddedViewRef,
  EnvironmentInjector,
  inject,
  Injector,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FeatureSwitches } from '../features/feature-switches.service';
import {
  APP_RESET_WORKSPACES,
  AppResetService,
} from '../regions/reset/app-reset.service';
import { provideLayout } from '../layout/layout';
import { SurfaceCloseGuard } from '../regions/pane/unsaved-work/surface-close-guard';
import { RetainedComponent } from '../regions/pane/retention/retained-component';
import { RetainedViewStash } from '../regions/pane/retention/retained-view-stash';
import { UnsavedWork } from '../regions/pane/unsaved-work/unsaved-work';
import { PanelState } from '../regions/panel/panel-state';
import { CONTENT_DOCK } from '../regions/pane/tree/pane-address';
import { PaneTreeService } from '../regions/pane/tree/pane-tree.service';
import { provideWorkspaces } from './declaration/provide-workspaces';
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

@Component({ selector: 'lw-test-draft', template: '' })
class Draft {
  surfaceDirty(): boolean {
    return true;
  }
}

@Component({
  imports: [RetainedComponent],
  template: `
    @if (workspaces.activeId() === home) {
      <ng-container
        [lwRetainedComponent]="surface"
        [componentInjector]="injector"
        retentionKey="main:main|notes/shown"
        [retain]="true"
      />
    }
  `,
})
class PaneOfTheWorkspaceInUse {
  protected readonly workspaces = inject(WorkspaceService);
  protected readonly home = this.workspaces.activeId();
  protected readonly surface = Draft;
  protected readonly injector = inject(Injector);
}

function draft(key: string, placement: 'shown' | 'parked'): ComponentRef<Draft> {
  const ref = createComponent(Draft, {
    environmentInjector: TestBed.inject(EnvironmentInjector),
  });
  const slot = TestBed.inject(RetainedViewStash).acquire(key, Draft, () => ({
    view: ref.hostView as EmbeddedViewRef<unknown>,
    instance: ref.instance,
  }));
  if (placement === 'parked') {
    slot.detach(true);
  }
  return ref;
}

function compose(answer = true) {
  localStorage.clear();
  const guard = {
    confirmDiscard: vi.fn<(candidates: readonly unknown[]) => Promise<boolean>>(
      async () => answer,
    ),
  };
  const dirty = { surfaceDirty: () => true };
  const unsavedWork = {
    instancesEverywhere: vi.fn((): unknown[] => [dirty]),
  };
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
      { provide: UnsavedWork, useValue: unsavedWork },
      {
        provide: APP_RESET_WORKSPACES,
        useFactory: () => {
          const workspaces = inject(WorkspaceService);
          return () => workspaces.resetAll();
        },
      },
    ],
  });
  return { ws: TestBed.inject(WorkspaceService), guard, unsavedWork, dirty };
}

async function nextTask(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function rearrangeTheActiveWorkspace(): Promise<void> {
  await nextTask();
  TestBed.inject(PaneTreeService).insertTab(CONTENT_DOCK, 'main', 'orders/o-1');
}

function arrangement(): string {
  return JSON.stringify(TestBed.inject(PaneTreeService).tree(CONTENT_DOCK));
}

function stored(workspaceId: string): string {
  return localStorage.getItem(`lw.shell.pane-trees:${workspaceId}`) ?? '';
}

describe('WorkspaceService asks about unsaved work where the command did', () => {
  it('resetting the active workspace asks with all retained work and reports that it ran', async () => {
    const { ws, guard, dirty } = compose();
    await rearrangeTheActiveWorkspace();
    expect(stored('overview')).toContain('orders/o-1');

    const ran = await ws.reset();

    expect(ran).toBe(true);
    expect(guard.confirmDiscard).toHaveBeenCalledWith([dirty]);
    expect(stored('overview')).not.toContain('orders/o-1');
  });

  it('a declined reset reports so and changes nothing', async () => {
    const { ws } = compose(false);
    await rearrangeTheActiveWorkspace();
    const before = arrangement();

    const ran = await ws.reset();

    expect(ran).toBe(false);
    expect(arrangement()).toBe(before);
    expect(before).toContain('orders/o-1');
  });

  it('resetting a workspace the user is not in asks about nothing the user is looking at', async () => {
    const { ws, guard } = compose();
    localStorage.setItem('lw.shell.pane-trees:orders', REARRANGED);

    const ran = await ws.reset('orders');

    expect(ran).toBe(true);
    expect(guard.confirmDiscard).toHaveBeenLastCalledWith([]);
    expect(stored('orders')).not.toContain('orders/o-1');
  });

  it('resetting a workspace the user is not in asks for the work parked under it, and keeps it when declined', async () => {
    const { ws, guard } = compose(false);
    await ws.switchTo('orders');
    await rearrangeTheActiveWorkspace();
    const parked = draft('main:main|orders/o-1', 'parked');
    await ws.switchTo('overview');
    expect(stored('orders')).toContain('orders/o-1');

    const ran = await ws.reset('orders');

    expect(ran).toBe(false);
    expect(guard.confirmDiscard).toHaveBeenLastCalledWith([parked.instance]);
    expect(parked.hostView.destroyed).toBe(false);
    expect(stored('orders')).toContain('orders/o-1');
  });

  it('resetAll asks once for every workspace', async () => {
    const { ws, guard } = compose();
    await rearrangeTheActiveWorkspace();
    localStorage.setItem('lw.shell.pane-trees:orders', REARRANGED);
    expect(stored('overview')).toContain('orders/o-1');

    const ran = await ws.resetAll();

    expect(ran).toBe(true);
    expect(guard.confirmDiscard).toHaveBeenCalledTimes(1);
    expect(stored('overview')).not.toContain('orders/o-1');
    expect(stored('orders')).not.toContain('orders/o-1');
  });

  it('removing the workspace the user is in asks once for the work its surfaces show and the work parked under it', async () => {
    const { ws, guard, unsavedWork } = compose(false);
    const stash = TestBed.inject(RetainedViewStash);
    unsavedWork.instancesEverywhere.mockImplementation(() => stash.instances());
    await ws.switchTo('orders');
    draft('main:main|orders/o-9', 'parked');
    await ws.switchTo('overview');
    await ws.saveCurrent('scratch');
    const saved = ws.workspaces().find((w) => w.name === 'scratch');
    if (!saved) {
      throw new Error('no saved workspace');
    }
    const parked = draft('main:main|notes/parked', 'parked');
    const shown = draft('main:main|notes/shown', 'shown');

    const ran = await ws.remove(saved.id);

    expect(ran).toBe(false);
    expect(guard.confirmDiscard).toHaveBeenCalledTimes(1);
    expect(new Set(guard.confirmDiscard.mock.lastCall?.at(0))).toEqual(
      new Set([parked.instance, shown.instance]),
    );
    expect(ws.workspaces().some((w) => w.id === saved.id)).toBe(true);
  });

  it('removing the workspace the user is in leaves nothing of it parked once its work is discarded', async () => {
    const { ws } = compose();
    await ws.saveCurrent('scratch');
    const saved = ws.workspaces().find((w) => w.name === 'scratch');
    if (!saved) {
      throw new Error('no saved workspace');
    }
    const pane = TestBed.createComponent(PaneOfTheWorkspaceInUse);
    pane.autoDetectChanges();
    await pane.whenStable();
    const stash = TestBed.inject(RetainedViewStash);
    expect(stash.instances()).toHaveLength(1);

    const ran = await ws.remove(saved.id);
    await nextTask();
    await pane.whenStable();
    await nextTask();

    expect(ran).toBe(true);
    expect(ws.activeId()).toBe('overview');
    expect(stash.parkedInstancesOf(saved.id)).toEqual([]);
    expect(stash.instances()).toEqual([]);
  });

  it('removing a workspace the user is not in asks for the work parked under it', async () => {
    const { ws, guard } = compose(false);
    await ws.saveCurrent('scratch');
    const saved = ws.workspaces().find((w) => w.name === 'scratch');
    if (!saved) {
      throw new Error('no saved workspace');
    }
    await ws.switchTo('overview');
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
    await ws.switchTo('overview');

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
    const { guard } = compose();
    await rearrangeTheActiveWorkspace();
    expect(stored('overview')).toContain('orders/o-1');
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
    await rearrangeTheActiveWorkspace();
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
    const { ws } = compose();
    TestBed.inject(FeatureSwitches).update({ workspaces: { enabled: false } });

    await ws.switchTo('orders');
    expect(ws.activeId()).toBe('orders');
    await rearrangeTheActiveWorkspace();
    expect(stored('orders')).toContain('orders/o-1');

    const ran = await ws.reset();
    expect(ran).toBe(true);
    expect(stored('orders')).not.toContain('orders/o-1');
  });
});

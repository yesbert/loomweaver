import {
  Component,
  EmbeddedViewRef,
  EnvironmentInjector,
  Injector,
  OnDestroy,
  Type,
  createComponent,
  inject,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ContentRoute, DirtySurface } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../../contributions/contribution-registry';
import { NotificationService } from '../../../notifications/notification.service';
import { ActiveWorkspaceService } from '../../../workspace/active-workspace.service';
import { CONTENT_DOCK } from '../tree/pane-address';
import { PaneTreeService } from '../tree/pane-tree.service';
import { RetainedComponent } from './retained-component';
import { RetainedViewStash } from './retained-view-stash';
import { ParkedViewSweep } from './parked-view-sweep';
import { RetentionUnloadGuard } from '../unsaved-work/retention-unload-guard';

let instances: ProbeView[] = [];
let destroyed = 0;

@Component({
  selector: 'lw-retention-probe',
  template: `<span data-testid="probe">{{ draft() }}</span>`,
})
class ProbeView implements OnDestroy {
  readonly draft = signal('');

  constructor() {
    instances.push(this);
  }

  ngOnDestroy(): void {
    destroyed += 1;
  }
}

let dirtyInstances: DirtyProbeView[] = [];
let dirtyDestroyed = 0;
let saveCalls = 0;
let saveFails = false;

@Component({
  selector: 'lw-dirty-probe',
  template: `<span data-testid="dirty-probe">{{ draft() }}</span>`,
})
class DirtyProbeView implements OnDestroy, DirtySurface {
  readonly draft = signal('');
  readonly saved = signal('');

  constructor() {
    dirtyInstances.push(this);
  }

  ngOnDestroy(): void {
    dirtyDestroyed += 1;
  }

  surfaceDirty(): boolean {
    return this.draft() !== this.saved();
  }

  surfaceSave(): Promise<void> {
    saveCalls += 1;
    if (saveFails) {
      return Promise.reject(new Error('save failed'));
    }
    return Promise.resolve().then(() => this.saved.set(this.draft()));
  }
}

@Component({
  imports: [RetainedComponent],
  template: `
    @if (visible()) {
      <div data-testid="slot-a">
        <ng-container
          [lwRetainedComponent]="component"
          [componentInjector]="injector()"
          [retentionKey]="key()"
        />
      </div>
    }
  `,
})
class DirtyHost {
  readonly component: Type<unknown> = DirtyProbeView;
  readonly visible = signal(true);
  readonly key = signal('content:main|notes');
  readonly injector = signal(inject(Injector));
}

async function afterSweep(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

describe('surface retention', () => {
  beforeEach(() => {
    localStorage.clear();
    instances = [];
    destroyed = 0;
    dirtyInstances = [];
    dirtyDestroyed = 0;
    saveCalls = 0;
    saveFails = false;
    TestBed.inject(ContributionRegistry).addContentRoute({
      path: 'notes',
      component: ProbeView,
    });
  });

  describe('ParkedViewSweep (closed is not hidden)', () => {
    function retainedEntry(key: string): void {
      const stash = TestBed.inject(RetainedViewStash);
      const slot = stash.acquire(key, ProbeView, () => {
        const componentRef = createComponent(ProbeView, {
          environmentInjector: TestBed.inject(EnvironmentInjector),
        });
        return {
          view: componentRef.hostView as EmbeddedViewRef<unknown>,
          instance: componentRef.instance,
        };
      });
      slot.detach(true);
    }

    it('keeps a retained instance while its tab is open and destroys it once the tab is gone', () => {
      const paneTree = TestBed.inject(PaneTreeService);
      paneTree.seedPrimaryTabs(CONTENT_DOCK, ['notes', 'other']);
      retainedEntry('content:main|notes');

      TestBed.inject(ParkedViewSweep).start();
      TestBed.tick();
      expect(destroyed).toBe(0);

      paneTree.removeTab(CONTENT_DOCK, 'main', 'notes');
      TestBed.tick();

      expect(destroyed).toBe(1);
    });

    it('keeps a retained instance parked by a workspace switch, and hands it back on return', () => {
      const paneTree = TestBed.inject(PaneTreeService);
      const workspace = TestBed.inject(ActiveWorkspaceService);
      paneTree.seedPrimaryTabs(CONTENT_DOCK, ['notes']);
      retainedEntry('content:main|notes');
      const parked = instances.at(-1);

      TestBed.inject(ParkedViewSweep).start();
      TestBed.tick();

      workspace.set('other');
      paneTree.hydrate(undefined);
      paneTree.seedPrimaryTabs(CONTENT_DOCK, ['elsewhere']);
      TestBed.tick();

      expect(destroyed).toBe(0);

      workspace.set('default');
      paneTree.hydrate(undefined);
      paneTree.seedPrimaryTabs(CONTENT_DOCK, ['notes']);
      TestBed.tick();

      expect(destroyed).toBe(0);
      expect(
        TestBed.inject(RetainedViewStash)
          .parked()
          .map((entry) => entry.instance),
      ).toContain(parked);
    });

    it('still destroys a retained instance whose tab is closed in the workspace it belongs to', () => {
      const paneTree = TestBed.inject(PaneTreeService);
      TestBed.inject(ActiveWorkspaceService).set('other');
      paneTree.seedPrimaryTabs(CONTENT_DOCK, ['notes', 'kept']);
      retainedEntry('content:main|notes');

      TestBed.inject(ParkedViewSweep).start();
      TestBed.tick();
      expect(destroyed).toBe(0);

      paneTree.removeTab(CONTENT_DOCK, 'main', 'notes');
      TestBed.tick();

      expect(destroyed).toBe(1);
    });

    it('lets go of what a removed workspace was keeping', () => {
      const paneTree = TestBed.inject(PaneTreeService);
      const workspace = TestBed.inject(ActiveWorkspaceService);
      paneTree.seedPrimaryTabs(CONTENT_DOCK, ['notes']);
      retainedEntry('content:main|notes');

      TestBed.inject(ParkedViewSweep).start();
      TestBed.tick();

      workspace.set('other');
      paneTree.hydrate(undefined);
      TestBed.tick();
      expect(destroyed).toBe(0);

      TestBed.inject(RetainedViewStash).evictWorkspace('default');

      expect(destroyed).toBe(1);
    });

    it('destroys a retained instance whose surface is no longer registered', () => {
      const paneTree = TestBed.inject(PaneTreeService);
      paneTree.seedPrimaryTabs(CONTENT_DOCK, ['gone']);
      retainedEntry('content:main|gone');

      TestBed.inject(ParkedViewSweep).start();
      TestBed.tick();

      expect(destroyed).toBe(1);
    });
  });

  describe('dirty keeps a hidden instance alive', () => {
    function seedOpenTab(): void {
      TestBed.inject(PaneTreeService).seedPrimaryTabs(CONTENT_DOCK, [
        'notes',
        'other',
      ]);
    }

    it('parks a hidden dirty instance and destroys it the moment it reports clean', async () => {
      seedOpenTab();
      TestBed.inject(ParkedViewSweep).start();
      const fixture = TestBed.createComponent(DirtyHost);
      fixture.detectChanges();
      dirtyInstances[0].draft.set('typed');

      fixture.componentInstance.visible.set(false);
      fixture.detectChanges();
      await afterSweep();
      TestBed.tick();
      expect(dirtyDestroyed).toBe(0);

      dirtyInstances[0].saved.set('typed');
      TestBed.tick();

      expect(dirtyDestroyed).toBe(1);
    });

    it('fires saveOn:hide once when a dirty instance is hidden, and a successful save releases it', async () => {
      TestBed.inject(ContributionRegistry).addContentRoute({
        path: 'notes',
        component: DirtyProbeView,
        saveOn: 'hide',
      } as ContentRoute);
      seedOpenTab();
      TestBed.inject(ParkedViewSweep).start();
      const fixture = TestBed.createComponent(DirtyHost);
      fixture.detectChanges();
      dirtyInstances[0].draft.set('typed');

      fixture.componentInstance.visible.set(false);
      fixture.detectChanges();
      TestBed.tick();
      expect(saveCalls).toBe(1);

      await afterSweep();
      TestBed.tick();

      expect(dirtyInstances[0].saved()).toBe('typed');
      expect(dirtyDestroyed).toBe(1);
    });

    it('keeps the instance alive and reports visibly when saveOn:hide fails', async () => {
      saveFails = true;
      TestBed.inject(ContributionRegistry).addContentRoute({
        path: 'notes',
        component: DirtyProbeView,
        saveOn: 'hide',
      } as ContentRoute);
      seedOpenTab();
      TestBed.inject(ParkedViewSweep).start();
      const fixture = TestBed.createComponent(DirtyHost);
      fixture.detectChanges();
      dirtyInstances[0].draft.set('typed');

      fixture.componentInstance.visible.set(false);
      fixture.detectChanges();
      TestBed.tick();
      await afterSweep();
      TestBed.tick();

      expect(saveCalls).toBe(1);
      expect(dirtyDestroyed).toBe(0);
      expect(
        TestBed.inject(NotificationService)
          .notifications()
          .map((toast) => toast.message),
      ).toContain('retention.saveFailed');
    });

    it('blocks beforeunload while any surface is dirty, and stops once clean', () => {
      seedOpenTab();
      TestBed.inject(RetentionUnloadGuard).start();
      const fixture = TestBed.createComponent(DirtyHost);
      fixture.detectChanges();
      dirtyInstances[0].draft.set('typed');

      const dirtyEvent = new Event('beforeunload', { cancelable: true });
      globalThis.dispatchEvent(dirtyEvent);
      expect(dirtyEvent.defaultPrevented).toBe(true);

      dirtyInstances[0].saved.set('typed');
      const cleanEvent = new Event('beforeunload', { cancelable: true });
      globalThis.dispatchEvent(cleanEvent);
      expect(cleanEvent.defaultPrevented).toBe(false);
    });
  });
});

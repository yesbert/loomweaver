import {
  Component,
  createComponent,
  EmbeddedViewRef,
  EnvironmentInjector,
  inject,
  Injector,
  OnDestroy,
  signal,
  Type,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SURFACE_HOLD } from '@loomweaver/plugin-sdk';
import { WorkspaceService } from '../../../workspace/workspace.service';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { ViewMountService } from '../../../views/view-mount.service';
import { CONTENT_DOCK } from '../tree/pane-address';
import { PaneTreeService } from '../tree/pane-tree.service';
import { RetainedComponent } from './retained-component';
import { RetainedViewStash } from './retained-view-stash';
import { RetentionGc } from './retention-gc';
import { SurfaceRetentionMode } from './retention-policy';
import { createSurfaceHold, SURFACE_HOLD_STATE } from './surface-hold';

const KEY = 'panel:right|view:chat';

let probes: HoldProbe[] = [];
let ended = 0;

@Component({
  selector: 'lw-hold-probe',
  template: `<span>chat</span>`,
})
class HoldProbe implements OnDestroy {
  readonly hold = inject(SURFACE_HOLD);

  constructor() {
    probes.push(this);
  }

  ngOnDestroy(): void {
    ended += 1;
  }
}

@Component({
  imports: [RetainedComponent],
  template: `
    @if (visible()) {
      <div data-testid="place">
        <ng-container
          [lwRetainedComponent]="component"
          [componentInjector]="injector"
          [retentionKey]="key"
          [mode]="mode()"
          [retain]="retain()"
        />
      </div>
    }
  `,
})
class HoldHost {
  readonly component: Type<unknown> = HoldProbe;
  readonly key = KEY;
  readonly visible = signal(true);
  readonly mode = signal<SurfaceRetentionMode>('move');
  readonly retain = signal(false);
  private readonly pair = createSurfaceHold();
  readonly injector = Injector.create({
    parent: inject(Injector),
    providers: [
      { provide: SURFACE_HOLD, useValue: this.pair.handle },
      { provide: SURFACE_HOLD_STATE, useValue: this.pair.state },
    ],
  });
}

async function settled(): Promise<void> {
  TestBed.tick();
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

function mounted(mode: SurfaceRetentionMode = 'move', retain = false) {
  const fixture = TestBed.createComponent(HoldHost);
  fixture.componentInstance.mode.set(mode);
  fixture.componentInstance.retain.set(retain);
  fixture.detectChanges();
  const element = fixture.nativeElement.querySelector('lw-hold-probe') as HTMLElement;
  const elsewhere = document.createElement('div');
  document.body.append(elsewhere);
  const hide = () => {
    fixture.componentInstance.visible.set(false);
    fixture.detectChanges();
  };
  const show = () => {
    fixture.componentInstance.visible.set(true);
    fixture.detectChanges();
  };
  const place = () => fixture.nativeElement.querySelector('[data-testid="place"]');
  return { fixture, element, elsewhere, hide, show, place, hold: probes[0].hold };
}

describe('a surface held where its product put it', () => {
  beforeEach(() => {
    probes = [];
    ended = 0;
  });

  describe('the handle', () => {
    it('is provided to each docked instance on its own', () => {
      const mounts = TestBed.inject(ViewMountService);
      const first = mounts.injectorForInstance('chat').get(SURFACE_HOLD);
      const second = mounts.injectorForInstance('chat~2').get(SURFACE_HOLD);

      first.hold();

      expect(first.held()).toBe(true);
      expect(second.held()).toBe(false);
      expect(mounts.injectorForInstance('chat').get(SURFACE_HOLD)).toBe(first);
    });

    it('is refused, with the reason, outside a docked surface', () => {
      expect(() => TestBed.inject(SURFACE_HOLD)).toThrow(/docked surface/);
    });
  });

  describe('while held', () => {
    it('stays where its product put it when its panel collapses, and keeps running', async () => {
      const app = mounted();
      app.hold.hold();
      app.elsewhere.append(app.element);

      app.hide();
      await settled();

      expect(app.elsewhere.contains(app.element)).toBe(true);
      expect(ended).toBe(0);
    });

    it('is neither hidden nor moved when its in-place slot is switched away', async () => {
      const app = mounted('in-place', true);
      app.hold.hold();
      app.elsewhere.append(app.element);

      app.hide();
      await settled();

      expect(app.elsewhere.contains(app.element)).toBe(true);
      expect(app.element.style.display).not.toBe('none');
      expect(ended).toBe(0);
    });

    it('is not pulled back when its place is shown again', async () => {
      const app = mounted();
      app.hold.hold();
      app.elsewhere.append(app.element);

      app.hide();
      await settled();
      app.show();
      await settled();

      expect(app.elsewhere.contains(app.element)).toBe(true);
      expect(probes).toHaveLength(1);
    });

    it('still ends when it is closed, wherever its nodes are', async () => {
      const app = mounted();
      app.hold.hold();
      app.elsewhere.append(app.element);
      app.hide();
      await settled();

      TestBed.inject(RetainedViewStash).evictParked(KEY);

      expect(ended).toBe(1);
      expect(app.elsewhere.contains(app.element)).toBe(false);
    });

    it('comes back unheld, in its place, when its view is shown again after being closed', async () => {
      const app = mounted();
      app.hold.hold();
      app.elsewhere.append(app.element);
      app.hide();
      await settled();
      TestBed.inject(RetainedViewStash).evictParked(KEY);

      app.show();
      await settled();

      expect(app.hold.held()).toBe(false);
      expect(probes).toHaveLength(2);
      expect(app.place()?.querySelector('lw-hold-probe')).not.toBeNull();
    });
  });

  describe('the retention collector', () => {
    function heldParkedEntry(key: string) {
      TestBed.inject(ContributionRegistry).addContentRoute({
        path: 'notes',
        component: HoldProbe,
      });
      const pair = createSurfaceHold();
      const slot = TestBed.inject(RetainedViewStash).acquire(key, HoldProbe, () => {
        const componentRef = createComponent(HoldProbe, {
          environmentInjector: TestBed.inject(EnvironmentInjector),
          elementInjector: Injector.create({
            providers: [
              { provide: SURFACE_HOLD, useValue: pair.handle },
              { provide: SURFACE_HOLD_STATE, useValue: pair.state },
            ],
          }),
        });
        return {
          view: componentRef.hostView as EmbeddedViewRef<unknown>,
          instance: componentRef.instance,
          hold: pair.state,
        };
      });
      pair.handle.hold();
      slot.release(false);
      return pair.handle;
    }

    it('does not let go of a held surface for being hidden while its tab is open', async () => {
      TestBed.inject(PaneTreeService).seedPrimaryTabs(CONTENT_DOCK, ['notes']);
      heldParkedEntry('content:main|notes');

      TestBed.inject(RetentionGc).start();
      await settled();

      expect(ended).toBe(0);
    });

    it('lets go of it by the ordinary rules once it is released', async () => {
      TestBed.inject(PaneTreeService).seedPrimaryTabs(CONTENT_DOCK, ['notes']);
      const hold = heldParkedEntry('content:main|notes');
      TestBed.inject(RetentionGc).start();
      await settled();

      hold.release();
      await settled();

      expect(ended).toBe(1);
    });

    describe('when the workspace is reset', () => {
      const SIDEBAR_KEY = 'primary:left-panel|view:chat';

      beforeEach(() => {
        TestBed.configureTestingModule({
          providers: [provideRouter([{ path: '**', children: [] }])],
        });
      });

      it('ends the hold of a surface acquired in that workspace', async () => {
        const hold = heldParkedEntry(SIDEBAR_KEY);

        await TestBed.inject(WorkspaceService).reset();

        expect(hold.held()).toBe(false);
      });

      it('ends a held surface it no longer shows, as it ends one that never held', async () => {
        heldParkedEntry(SIDEBAR_KEY);
        TestBed.inject(RetentionGc).start();
        await settled();
        expect(ended).toBe(0);

        await TestBed.inject(WorkspaceService).reset();
        await settled();

        expect(ended).toBe(1);
      });
    });

    it('still ends a held surface whose tab is closed', async () => {
      const paneTree = TestBed.inject(PaneTreeService);
      paneTree.seedPrimaryTabs(CONTENT_DOCK, ['notes', 'other']);
      heldParkedEntry('content:main|notes');
      TestBed.inject(RetentionGc).start();
      await settled();

      paneTree.removeTab(CONTENT_DOCK, 'main', 'notes');
      await settled();

      expect(ended).toBe(1);
    });
  });

  describe('once released', () => {
    it('is put back in its place when that place is visible', async () => {
      const app = mounted();
      app.hold.hold();
      app.elsewhere.append(app.element);
      await settled();

      app.hold.release();
      await settled();

      expect(app.place()?.contains(app.element)).toBe(true);
    });

    it('is released as the collapse asked, and destroyed by the ordinary rules', async () => {
      const app = mounted();
      app.hold.hold();
      app.elsewhere.append(app.element);
      app.hide();
      await settled();

      app.hold.release();
      await settled();

      expect(app.elsewhere.contains(app.element)).toBe(false);
      expect(ended).toBe(1);
    });

    it('is hidden as the in-place switch asked, and kept when it asks to be kept', async () => {
      const app = mounted('in-place', true);
      app.hold.hold();
      app.elsewhere.append(app.element);
      app.hide();
      await settled();

      app.hold.release();
      await settled();

      expect(app.element.style.display).toBe('none');
      expect(ended).toBe(0);
    });
  });
});

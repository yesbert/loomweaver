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
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { CONTENT_DOCK } from '../tree/pane-address';
import { PaneTreeService } from '../tree/pane-tree.service';
import { RetainedComponent } from './retained-component';
import { RetainedViewStash } from './retained-view-stash';
import { ParkedViewSweep } from './parked-view-sweep';
import { SurfaceRetentionMode } from './retention-policy';

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

@Component({
  imports: [RetainedComponent],
  template: `
    @if (slot() === 'a') {
      <div data-testid="slot-a">
        <ng-container
          [lwRetainedComponent]="component"
          [componentInjector]="injector()"
          [retentionKey]="key()"
          [mode]="mode()"
          [retain]="retain()"
        />
      </div>
    } @else if (slot() === 'b') {
      <section data-testid="slot-b">
        <ng-container
          [lwRetainedComponent]="component"
          [componentInjector]="injector()"
          [retentionKey]="key()"
          [mode]="mode()"
          [retain]="retain()"
        />
      </section>
    }
  `,
})
class ComponentHost {
  readonly component: Type<unknown> = ProbeView;
  readonly slot = signal<'a' | 'b' | 'none'>('a');
  readonly key = signal('content:main|notes');
  readonly mode = signal<SurfaceRetentionMode>('move');
  readonly retain = signal(false);
  readonly injector = signal(inject(Injector));
}

@Component({
  imports: [RetainedComponent],
  template: `
    @if (paneAlive()) {
      <div [attr.data-testid]="slot()">
        @if (mountAlive()) {
          <ng-container
            [lwRetainedComponent]="mounted() ? component : null"
            [componentInjector]="injector()"
            [retentionKey]="key()"
            mode="in-place"
            [retain]="retain()"
          />
        }
      </div>
    }
  `,
})
class InPlaceHost {
  readonly component: Type<unknown> = ProbeView;
  readonly mounted = signal(true);
  readonly paneAlive = signal(true);
  readonly mountAlive = signal(true);
  readonly slot = signal('slot-a');
  readonly key = signal('content:main|frame');
  readonly retain = signal(true);
  readonly injector = signal(inject(Injector));
}

async function afterSweep(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

function element(fixture: { nativeElement: HTMLElement }, selector: string) {
  return fixture.nativeElement.querySelector(selector);
}

describe('surface retention', () => {
  beforeEach(() => {
    localStorage.clear();
    instances = [];
    destroyed = 0;
    TestBed.inject(ContributionRegistry).addContentRoute({
      path: 'notes',
      component: ProbeView,
    });
  });

  describe('RetainedComponent', () => {
    it('moves a pane surface across a branch swap instead of rebuilding it', async () => {
      const fixture = TestBed.createComponent(ComponentHost);
      fixture.detectChanges();
      expect(instances).toHaveLength(1);
      instances[0].draft.set('typed');

      fixture.componentInstance.slot.set('b');
      fixture.detectChanges();
      await afterSweep();

      expect(instances).toHaveLength(1);
      expect(destroyed).toBe(0);
      TestBed.tick();
      expect(
        element(fixture, '[data-testid="slot-b"] [data-testid="probe"]')
          ?.textContent,
      ).toBe('typed');
    });

    it('destroys the old surface on a tab switch (key change) after the claim window', async () => {
      const fixture = TestBed.createComponent(ComponentHost);
      fixture.detectChanges();

      fixture.componentInstance.key.set('content:main|other');
      fixture.detectChanges();
      await afterSweep();

      expect(instances).toHaveLength(2);
      expect(destroyed).toBe(1);
    });

    it('never self-claims on a same-key remount with a fresh injector', () => {
      const fixture = TestBed.createComponent(ComponentHost);
      fixture.detectChanges();
      const first = instances[0];

      fixture.componentInstance.injector.set(
        Injector.create({ providers: [], parent: TestBed.inject(Injector) }),
      );
      fixture.detectChanges();

      expect(instances).toHaveLength(2);
      expect(destroyed).toBe(1);
      expect(instances[1]).not.toBe(first);
    });

    it('destroys a hidden rebuild-only surface immediately', () => {
      const fixture = TestBed.createComponent(ComponentHost);
      fixture.componentInstance.mode.set('rebuild');
      fixture.detectChanges();

      fixture.componentInstance.slot.set('none');
      fixture.detectChanges();

      expect(destroyed).toBe(1);
    });

    it('keeps a hidden surface alive when it retains, and hands the instance back on remount', async () => {
      const fixture = TestBed.createComponent(ComponentHost);
      fixture.componentInstance.retain.set(true);
      fixture.detectChanges();
      instances[0].draft.set('typed');

      fixture.componentInstance.slot.set('none');
      fixture.detectChanges();
      await afterSweep();

      expect(destroyed).toBe(0);

      fixture.componentInstance.slot.set('a');
      fixture.detectChanges();
      TestBed.tick();

      expect(instances).toHaveLength(1);
      expect(
        element(fixture, '[data-testid="slot-a"] [data-testid="probe"]')
          ?.textContent,
      ).toBe('typed');
    });
  });

  describe('iframe retention (hidden in place)', () => {
    function probeElement(fixture: {
      nativeElement: HTMLElement;
    }): HTMLElement | null {
      return fixture.nativeElement.querySelector('lw-retention-probe');
    }

    it('hides a retained in-place surface without moving it, and reveals the same instance', () => {
      const fixture = TestBed.createComponent(InPlaceHost);
      fixture.detectChanges();
      const first = instances[0];
      const element = probeElement(fixture);

      fixture.componentInstance.mounted.set(false);
      fixture.detectChanges();

      expect(destroyed).toBe(0);
      expect(probeElement(fixture)).toBe(element);
      expect(element?.style.display).toBe('none');

      fixture.componentInstance.mounted.set(true);
      fixture.detectChanges();

      expect(instances).toHaveLength(1);
      expect(instances[0]).toBe(first);
      expect(element?.style.display).toBe('');
    });

    it('rebuilds instead of reclaiming when the surface would have to move to another parent (no atomic move here)', () => {
      const fixture = TestBed.createComponent(InPlaceHost);
      fixture.detectChanges();

      fixture.componentInstance.mounted.set(false);
      fixture.detectChanges();
      fixture.componentInstance.slot.set('slot-b');
      fixture.componentInstance.paneAlive.set(false);
      fixture.detectChanges();
      fixture.componentInstance.paneAlive.set(true);
      fixture.componentInstance.mounted.set(true);
      fixture.detectChanges();

      expect(instances).toHaveLength(2);
      expect(instances[1]).not.toBe(instances[0]);
    });

    it('sweeps a hidden in-place surface that neither retains nor is dirty, and takes its nodes out of the DOM', async () => {
      const fixture = TestBed.createComponent(InPlaceHost);
      fixture.componentInstance.retain.set(false);
      fixture.detectChanges();

      fixture.componentInstance.mounted.set(false);
      fixture.detectChanges();
      await afterSweep();

      expect(destroyed).toBe(1);
      expect(probeElement(fixture)).toBeNull();
    });

    it('destroys an in-place surface when the pane around it dies and the browser cannot move it atomically', async () => {
      const fixture = TestBed.createComponent(InPlaceHost);
      fixture.detectChanges();

      fixture.componentInstance.paneAlive.set(false);
      fixture.detectChanges();
      await afterSweep();

      expect(destroyed).toBe(1);
    });

    it('moves in-place surfaces out of the way before an arrangement is swapped, not just those of panes that vanish', () => {
      const fixture = TestBed.createComponent(InPlaceHost);
      fixture.detectChanges();
      const paneTree = TestBed.inject(PaneTreeService);
      paneTree.seedPrimaryTabs(CONTENT_DOCK, ['notes']);
      const stash = TestBed.inject(RetainedViewStash);
      const evacuated: ((key: string) => boolean)[] = [];
      vi.spyOn(stash, 'evacuate').mockImplementation((matches) => {
        evacuated.push(matches);
      });

      paneTree.hydrate(undefined);

      expect(
        evacuated.some((matches) => matches(`${CONTENT_DOCK}:main|notes`)),
      ).toBe(true);
    });

    it('parks an in-place surface when only its mount point dies, and reclaims it', () => {
      const fixture = TestBed.createComponent(InPlaceHost);
      fixture.detectChanges();
      const before = probeElement(fixture);

      fixture.componentInstance.mountAlive.set(false);
      fixture.detectChanges();

      expect(destroyed).toBe(0);
      expect(probeElement(fixture)?.style.display).toBe('none');

      fixture.componentInstance.mountAlive.set(true);
      fixture.detectChanges();

      expect(probeElement(fixture)).toBe(before);
      expect(destroyed).toBe(0);
    });

    it('keeps a parked surface alive while its tab shows a sub-route', () => {
      const paneTree = TestBed.inject(PaneTreeService);
      TestBed.inject(ContributionRegistry).addContentRoute({
        path: 'frame',
        iframe: '/frame.html',
      } as never);
      paneTree.seedPrimaryTabs(CONTENT_DOCK, ['frame/architecture']);
      const stash = TestBed.inject(RetainedViewStash);
      const slot = stash.acquire('content:main|frame', ProbeView, () => {
        const componentRef = createComponent(ProbeView, {
          environmentInjector: TestBed.inject(EnvironmentInjector),
        });
        return {
          view: componentRef.hostView as EmbeddedViewRef<unknown>,
          instance: componentRef.instance,
        };
      });
      slot.detach(true);

      TestBed.inject(ParkedViewSweep).start();
      TestBed.tick();

      expect(destroyed).toBe(0);
    });
  });
});

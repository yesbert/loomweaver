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
import { ContributionRegistry } from '../../../contributions/contribution-registry';
import { moveNode, supportsAtomicMove } from './atomic-move';
import { RetainedComponent } from './retained-component';
import { RetainedTemplate } from './retained-template';
import { RetainedViewStash } from './retained-view-stash';
import { isKeyOfPane } from './retention-keys';

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
  imports: [RetainedTemplate, ProbeView],
  template: `
    @if (slot() === 'a') {
      <div data-testid="slot-a">
        <ng-container
          [lwRetainedTemplate]="probeTpl"
          retentionKey="primary:test"
          [retentionPath]="path()"
        />
      </div>
    } @else if (slot() === 'b') {
      <section data-testid="slot-b">
        <ng-container
          [lwRetainedTemplate]="probeTpl"
          retentionKey="primary:test"
          [retentionPath]="path()"
        />
      </section>
    }
    <ng-template #probeTpl><lw-retention-probe /></ng-template>
  `,
})
class TemplateHost {
  readonly slot = signal<'a' | 'b' | 'none'>('a');
  readonly path = signal('notes');
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

  describe('claiming a slot the outgoing mount still holds (TreeWeaver #41)', () => {
    function acquireProbe(stash: RetainedViewStash, key: string) {
      return stash.acquire(key, ProbeView, () => {
        const ref = createComponent(ProbeView, {
          environmentInjector: TestBed.inject(EnvironmentInjector),
        });
        return {
          view: ref.hostView as EmbeddedViewRef<unknown>,
          instance: ref.instance,
        };
      });
    }

    it('hands the entry to the incoming mount instead of building a throwaway', () => {
      const stash = TestBed.inject(RetainedViewStash);
      const first = acquireProbe(stash, 'content:main|notes');
      const held = instances.length;

      const second = acquireProbe(stash, 'content:main|notes');

      expect(instances.length).toBe(held);
      expect(second.rootNodes).toEqual(first.rootNodes);
    });

    it('ignores the displaced owner releasing the slot it no longer owns', async () => {
      const stash = TestBed.inject(RetainedViewStash);
      const first = acquireProbe(stash, 'content:main|notes');
      const second = acquireProbe(stash, 'content:main|notes');

      first.detach(false);
      await Promise.resolve();

      expect(destroyed).toBe(0);
      expect(second.rootNodes.length).toBeGreaterThan(0);
    });
  });

  describe('stale slots (TreeWeaver #42 — a surviving mount re-acquires after a takeover)', () => {
    function acquireProbe(stash: RetainedViewStash, key: string) {
      return stash.acquire(key, ProbeView, () => {
        const ref = createComponent(ProbeView, {
          environmentInjector: TestBed.inject(EnvironmentInjector),
        });
        return {
          view: ref.hostView as EmbeddedViewRef<unknown>,
          instance: ref.instance,
        };
      });
    }

    it('a slot is fresh after acquire', () => {
      const stash = TestBed.inject(RetainedViewStash);
      const slot = acquireProbe(stash, 'content:main|notes');
      expect(slot.stale()).toBe(false);
    });

    it('a slot is stale once another mount claims its entry over', () => {
      const stash = TestBed.inject(RetainedViewStash);
      const displaced = acquireProbe(stash, 'content:main|notes');

      const claimed = acquireProbe(stash, 'content:main|notes');

      expect(displaced.stale()).toBe(true);
      expect(claimed.stale()).toBe(false);
    });

    it('a throwaway slot over an occupied key never reads stale', () => {
      const stash = TestBed.inject(RetainedViewStash);
      acquireProbe(stash, 'content:main|notes');

      const throwaway = stash.acquire(
        'content:main|notes',
        TemplateHost,
        () => {
          const ref = createComponent(ProbeView, {
            environmentInjector: TestBed.inject(EnvironmentInjector),
          });
          return {
            view: ref.hostView as EmbeddedViewRef<unknown>,
            instance: ref.instance,
          };
        },
      );

      expect(throwaway.stale()).toBe(false);
    });
  });

  describe('atomic DOM move', () => {
    function probeElement(fixture: {
      nativeElement: HTMLElement;
    }): HTMLElement | null {
      return fixture.nativeElement.querySelector('lw-retention-probe');
    }

    interface MovableParent extends HTMLElement {
      moveBefore(node: Node, child: Node | null): void;
    }

    function fakeAtomicMove(): void {
      (Element.prototype as Partial<MovableParent>).moveBefore = function (
        this: HTMLElement,
        node: Node,
        child: Node | null,
      ) {
        moved.push(node);
        this.insertBefore(node, child);
      };
    }

    let moved: Node[] = [];

    beforeEach(() => {
      moved = [];
    });

    afterEach(() => {
      delete (Element.prototype as Partial<MovableParent>).moveBefore;
    });

    it('reports the browser capability from the document it is given', () => {
      expect(supportsAtomicMove(document)).toBe(false);

      fakeAtomicMove();

      expect(supportsAtomicMove(document)).toBe(true);
    });

    it('moves a connected node atomically and falls back for a detached one', () => {
      fakeAtomicMove();
      const parent = document.createElement('div');
      const node = document.createElement('span');
      parent.append(node);
      const target = document.createElement('div');
      document.body.append(parent);
      document.body.append(target);

      expect(moveNode(target, node, null)).toBe(true);
      expect(node.parentElement).toBe(target);

      const detached = document.createElement('span');

      expect(moveNode(target, detached, null)).toBe(false);
      expect(detached.parentElement).toBe(target);

      parent.remove();
      target.remove();
    });

    it('carries a retained in-place surface through the death of its pane', async () => {
      fakeAtomicMove();
      const fixture = TestBed.createComponent(InPlaceHost);
      fixture.detectChanges();
      const first = instances[0];
      const element = probeElement(fixture);

      TestBed.inject(RetainedViewStash).evacuate((key) =>
        isKeyOfPane(key, 'content', 'main'),
      );
      fixture.componentInstance.paneAlive.set(false);
      fixture.detectChanges();
      await afterSweep();

      expect(destroyed).toBe(0);

      fixture.componentInstance.paneAlive.set(true);
      fixture.detectChanges();

      expect(instances).toHaveLength(1);
      expect(instances[0]).toBe(first);
      expect(probeElement(fixture)).toBe(element);
    });

    it('brings an evacuated in-place surface back when the arrangement it made way for leaves its mount standing', async () => {
      fakeAtomicMove();
      const fixture = TestBed.createComponent(InPlaceHost);
      fixture.detectChanges();
      const first = instances[0];
      const element = probeElement(fixture);
      expect(element).not.toBeNull();

      TestBed.inject(RetainedViewStash).evacuate((key) =>
        isKeyOfPane(key, 'content', 'main'),
      );
      fixture.detectChanges();
      await afterSweep();

      expect(destroyed).toBe(0);
      expect(instances).toHaveLength(1);
      expect(instances[0]).toBe(first);
      expect(probeElement(fixture)).toBe(element);
    });
  });
});

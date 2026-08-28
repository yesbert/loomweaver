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
import { ContentRoute, DirtySurface, View } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { NotificationService } from '../../../notifications/notification.service';
import { ContentReuseStrategy } from '../../content/routing/content-reuse-strategy';
import { ActiveWorkspaceService } from '../../../workspace/active-workspace.service';
import { CONTENT_DOCK } from '../tree/pane-address';
import { PaneTreeService } from '../tree/pane-tree.service';
import { moveNode, supportsAtomicMove } from './atomic-move';
import { RetainedComponent } from './retained-component';
import { RetainedTemplate } from './retained-template';
import { RetainedViewStash } from './retained-view-stash';
import { RetentionGc } from './retention-gc';
import { RetentionUnloadGuard } from './retention-unload-guard';
import {
  containerChildInstances,
  effectiveRetain,
  SurfaceRetentionMode,
  surfaceRetentionMode,
  retainSurfacePath,
} from './retention-policy';

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
  imports: [RetainedTemplate, ProbeView],
  template: `
    @if (slot() === 'a') {
      <div data-testid="slot-a">
        <ng-container
          [lwRetainedTemplate]="condTpl"
          retentionKey="primary:cond"
          retentionPath="notes"
        />
      </div>
    } @else if (slot() === 'b') {
      <section data-testid="slot-b">
        <ng-container
          [lwRetainedTemplate]="condTpl"
          retentionKey="primary:cond"
          retentionPath="notes"
        />
      </section>
    }
    <ng-template #condTpl>
      @if (inner()) {
        <lw-retention-probe />
      }
    </ng-template>
  `,
})
class ConditionalTemplateHost {
  readonly slot = signal<'a' | 'b'>('a');
  readonly inner = signal(true);
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
  await new Promise<void>((resolve) => setTimeout(resolve));
}

function el(fixture: { nativeElement: HTMLElement }, selector: string) {
  return fixture.nativeElement.querySelector(selector);
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

  describe('surfaceRetentionMode', () => {
    it('moves views and component routes, parks iframes in place, rebuilds containers', () => {
      const routes = [
        { path: 'notes', component: ProbeView },
        { path: 'frame', iframe: '/frame.html' },
        {
          path: 'ws/:id',
          container: { children: ['a'] },
        },
      ] as unknown as ContentRoute[];

      expect(surfaceRetentionMode(routes, 'view:outline')).toBe('move');
      expect(surfaceRetentionMode(routes, 'notes')).toBe('move');
      expect(surfaceRetentionMode(routes, 'frame')).toBe('in-place');
      expect(surfaceRetentionMode(routes, 'ws/42')).toBe('rebuild');
      expect(surfaceRetentionMode([], 'unknown')).toBe('rebuild');
    });
  });

  describe('RetainedTemplate', () => {
    it('moves the primary view across a branch swap instead of rebuilding it (the split fix)', async () => {
      const fixture = TestBed.createComponent(TemplateHost);
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
        el(fixture, '[data-testid="slot-b"] [data-testid="probe"]')
          ?.textContent,
      ).toBe('typed');
    });

    it('destroys the view once it is hidden and nobody reclaims it', async () => {
      const fixture = TestBed.createComponent(TemplateHost);
      fixture.detectChanges();

      fixture.componentInstance.slot.set('none');
      fixture.detectChanges();
      await afterSweep();

      expect(destroyed).toBe(1);
    });

    it('moves branch content rendered after creation — a template rooted in a control-flow block', async () => {
      const fixture = TestBed.createComponent(ConditionalTemplateHost);
      fixture.detectChanges();
      TestBed.tick();
      expect(instances).toHaveLength(1);
      instances[0].draft.set('typed');

      fixture.componentInstance.slot.set('b');
      fixture.detectChanges();
      await afterSweep();

      expect(instances).toHaveLength(1);
      expect(destroyed).toBe(0);
      TestBed.tick();
      expect(
        el(fixture, '[data-testid="slot-b"] [data-testid="probe"]')
          ?.textContent,
      ).toBe('typed');
    });

    it('lets the hidden primary slot go, even when its surface declares retain', async () => {
      TestBed.inject(ContributionRegistry).addContentRoute({
        path: 'editor',
        component: ProbeView,
        retain: 'always',
      } as ContentRoute);
      const fixture = TestBed.createComponent(TemplateHost);
      fixture.componentInstance.path.set('editor');
      fixture.detectChanges();

      fixture.componentInstance.slot.set('none');
      fixture.detectChanges();
      await afterSweep();

      expect(destroyed).toBe(1);
    });

    it('rebuilds instead of moving when the active path is an iframe surface', async () => {
      TestBed.inject(ContributionRegistry).addContentRoute({
        path: 'frame',
        iframe: '/frame.html',
      } as ContentRoute);
      const fixture = TestBed.createComponent(TemplateHost);
      fixture.componentInstance.path.set('frame');
      fixture.detectChanges();
      expect(instances).toHaveLength(1);

      fixture.componentInstance.slot.set('b');
      fixture.detectChanges();
      await afterSweep();

      expect(instances).toHaveLength(2);
      expect(destroyed).toBe(1);
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
        el(fixture, '[data-testid="slot-b"] [data-testid="probe"]')
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
        el(fixture, '[data-testid="slot-a"] [data-testid="probe"]')
          ?.textContent,
      ).toBe('typed');
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

      first.release(false);
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

  describe('retention policy', () => {
    const routes = [
      { path: 'notes', component: ProbeView },
      { path: 'editor', component: ProbeView, retain: 'always' },
      { path: 'scratch', component: ProbeView, retain: 'never' },
      { path: 'frame', iframe: '/frame.html', retain: 'always' },
      { path: 'ws/:id', container: { children: ['a'] }, retain: 'always' },
    ] as unknown as ContentRoute[];
    const views = [
      { id: 'outline', region: 'primary', title: 't' },
      { id: 'inspector', region: 'primary', title: 't', retain: 'always' },
    ] as unknown as View[];

    it('lets the surface declaration win over the distribution default', () => {
      expect(effectiveRetain(undefined, 'destroy')).toBe(false);
      expect(effectiveRetain(undefined, 'retain')).toBe(true);
      expect(effectiveRetain('always', 'destroy')).toBe(true);
      expect(effectiveRetain('never', 'retain')).toBe(false);
    });

    it('resolves retention per path — iframe surfaces included, unknown paths never', () => {
      expect(retainSurfacePath(routes, views, 'notes', 'destroy')).toBe(false);
      expect(retainSurfacePath(routes, views, 'notes', 'retain')).toBe(true);
      expect(retainSurfacePath(routes, views, 'editor', 'destroy')).toBe(true);
      expect(retainSurfacePath(routes, views, 'scratch', 'retain')).toBe(false);
      expect(retainSurfacePath(routes, views, 'frame', 'destroy')).toBe(true);
      expect(retainSurfacePath(routes, views, 'ws/42', 'retain')).toBe(false);
      expect(retainSurfacePath(routes, views, 'view:outline', 'destroy')).toBe(
        false,
      );
      expect(
        retainSurfacePath(routes, views, 'view:inspector', 'destroy'),
      ).toBe(true);
      expect(retainSurfacePath(routes, views, 'unknown', 'retain')).toBe(false);
    });
  });

  describe('RetentionGc (closed is not hidden)', () => {
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
      slot.release(true);
    }

    it('keeps a retained instance while its tab is open and destroys it once the tab is gone', () => {
      const paneTree = TestBed.inject(PaneTreeService);
      paneTree.seedPrimaryTabs(CONTENT_DOCK, ['notes', 'other']);
      retainedEntry('content:main|notes');

      TestBed.inject(RetentionGc).start();
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

      TestBed.inject(RetentionGc).start();
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

      TestBed.inject(RetentionGc).start();
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

      TestBed.inject(RetentionGc).start();
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

      TestBed.inject(RetentionGc).start();
      TestBed.tick();

      expect(destroyed).toBe(1);
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
      const evacuated: string[] = [];
      vi.spyOn(stash, 'evacuate').mockImplementation((prefix: string) => {
        evacuated.push(prefix);
      });

      paneTree.hydrate(undefined);

      expect(evacuated).toContain(`${CONTENT_DOCK}:`);
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
      slot.release(true);

      TestBed.inject(RetentionGc).start();
      TestBed.tick();

      expect(destroyed).toBe(0);
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
      parent.appendChild(node);
      const target = document.createElement('div');
      document.body.appendChild(parent);
      document.body.appendChild(target);

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

      TestBed.inject(RetainedViewStash).evacuate('content:main|');
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
      TestBed.inject(RetentionGc).start();
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
      TestBed.inject(RetentionGc).start();
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
      TestBed.inject(RetentionGc).start();
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
      window.dispatchEvent(dirtyEvent);
      expect(dirtyEvent.defaultPrevented).toBe(true);

      dirtyInstances[0].saved.set('typed');
      const cleanEvent = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(cleanEvent);
      expect(cleanEvent.defaultPrevented).toBe(false);
    });

    it('keeps a dirty URL-pane handle and evicts it the moment it reports clean', () => {
      seedOpenTab();
      TestBed.inject(RetentionGc).start();
      const strategy = TestBed.inject(ContentReuseStrategy);
      const dirty = signal(true);
      const destroySpy = vi.fn();
      strategy.store(
        {
          routeConfig: { data: { content: true, group: 'g', retain: false } },
          url: [{ path: 'doc' }, { path: 'abc' }],
          params: { id: 'abc' },
        } as never,
        {
          componentRef: {
            instance: { surfaceDirty: () => dirty() },
            destroy: destroySpy,
          },
        } as never,
      );
      TestBed.tick();
      expect(destroySpy).not.toHaveBeenCalled();

      dirty.set(false);
      TestBed.tick();

      expect(destroySpy).toHaveBeenCalledTimes(1);
    });
  });
});

describe('containerChildInstances (a container tab closes its children)', () => {
  const entries = [
    { key: 'container@workspace/1:c1|canvas', instance: 'child-a' },
    { key: 'container@workspace/1:c2|details|inst', instance: 'child-b' },
    { key: 'container@workspace/12:c1|canvas', instance: 'other-container' },
    { key: 'content:main|workspace/1', instance: 'outer' },
  ];

  it('collects every entry of the tab path own container dock', () => {
    expect(containerChildInstances(entries, 'workspace/1')).toEqual([
      'child-a',
      'child-b',
    ]);
  });

  it('never matches a longer sibling path or a non-container scope', () => {
    expect(containerChildInstances(entries, 'workspace/12')).toEqual([
      'other-container',
    ]);
    expect(containerChildInstances(entries, 'workspace')).toEqual([]);
  });
});

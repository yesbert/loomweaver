import {
  Directive,
  ElementRef,
  EmbeddedViewRef,
  EnvironmentInjector,
  Injector,
  OnChanges,
  OnDestroy,
  Type,
  createComponent,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import { moveNode } from './atomic-move';
import { RetainedSlot } from './retained-view-model';
import { RetainedViewStash } from './retained-view-stash';
import { SurfaceRetentionMode } from './retention-policy';

interface MountedComponent {
  readonly key: string;
  readonly component: Type<unknown>;
  readonly injector: Injector;
  readonly slot: RetainedSlot;
  mode: SurfaceRetentionMode;
  retain: boolean;
}

@Directive({ selector: '[lwRetainedComponent]' })
export class RetainedComponent implements OnChanges, OnDestroy {
  readonly lwRetainedComponent = input.required<Type<unknown> | null>();
  readonly componentInjector = input.required<Injector | null>();
  readonly retentionKey = input.required<string>();
  readonly mode = input<SurfaceRetentionMode>('move');
  readonly retain = input<boolean>(false);

  private readonly stash = inject(RetainedViewStash);
  private readonly environmentInjector = inject(EnvironmentInjector);
  private readonly anchor: Node = inject(ElementRef).nativeElement;

  private mounted: MountedComponent | null = null;

  private repairQueued = false;

  constructor() {
    effect(() => {
      this.stash.version();
      untracked(() => this.reconcile());
    });
  }

  ngOnChanges(): void {
    this.sync();
  }

  ngOnDestroy(): void {
    this.park();
  }

  private sync(): void {
    const key = this.retentionKey();
    const component = this.lwRetainedComponent();
    const injector = this.componentInjector();
    const mounted = this.mounted;
    if (mounted && component !== null && mounted.key === key) {
      if (mounted.component === component && mounted.injector === injector) {
        mounted.mode = this.mode();
        mounted.retain = this.retain();
        mounted.slot.describe(mounted.mode, mounted.retain);
        return;
      }
      this.mounted = null;
      mounted.slot.discard();
    } else {
      this.park();
    }
    if (component === null || injector === null) {
      return;
    }
    const slot = this.stash.acquire(
      key,
      component,
      () => {
        const componentRef = createComponent(component, {
          environmentInjector: this.environmentInjector,
          elementInjector: injector,
        });
        return {
          view: componentRef.hostView as EmbeddedViewRef<unknown>,
          instance: componentRef.instance,
        };
      },
      this.anchor.parentNode,
    );
    if (!slot.attached) {
      this.place(slot.rootNodes);
    }
    this.mounted = {
      key,
      component,
      injector,
      slot,
      mode: this.mode(),
      retain: this.retain(),
    };
    slot.describe(this.mounted.mode, this.mounted.retain);
  }

  private park(): void {
    const mounted = this.mounted;
    this.mounted = null;
    if (!mounted) {
      return;
    }
    if (mounted.mode === 'move') {
      mounted.slot.release(mounted.retain);
      return;
    }
    if (mounted.mode === 'in-place') {
      mounted.slot.hide(mounted.retain);
      return;
    }
    mounted.slot.discard();
  }

  private reconcile(): void {
    const mounted = this.mounted;
    if (!mounted) {
      return;
    }
    if (mounted.slot.stale()) {
      this.park();
      this.sync();
      return;
    }
    this.queueRepair();
  }

  private queueRepair(): void {
    if (this.repairQueued) {
      return;
    }
    this.repairQueued = true;
    setTimeout(() => {
      this.repairQueued = false;
      const mounted = this.mounted;
      if (
        mounted &&
        !mounted.slot.stale() &&
        this.displaced(mounted.slot.rootNodes)
      ) {
        this.place(mounted.slot.rootNodes);
      }
    });
  }

  private displaced(nodes: readonly Node[]): boolean {
    const parent = this.anchor.parentNode;
    return (
      parent !== null &&
      nodes.length > 0 &&
      nodes.some((node) => node.parentNode !== parent)
    );
  }

  private place(nodes: readonly Node[]): void {
    const parent = this.anchor.parentNode;
    if (!parent) {
      return;
    }
    for (const node of nodes) {
      moveNode(parent, node, this.anchor);
    }
  }
}

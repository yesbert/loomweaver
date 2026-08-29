import { DOCUMENT } from '@angular/common';
import {
  ApplicationRef,
  EmbeddedViewRef,
  inject,
  OnDestroy,
  Service,
  signal,
  Signal,
} from '@angular/core';
import { ActiveWorkspaceService } from '../../../workspace/active-workspace.service';
import { moveNode, supportsAtomicMove } from './atomic-move';
import { SurfaceRetentionMode, instanceDirty } from './retention-policy';
import {
  ParkedEntry,
  RetainedSlot,
  RetainedViewHandle,
  RetainedViewSource,
} from './retained-view-model';

interface HiddenNode {
  readonly element: HTMLElement;
  readonly display: string;
}

interface StashEntry {
  readonly key: string;
  readonly source: RetainedViewSource;
  readonly view: EmbeddedViewRef<unknown>;
  readonly instance?: unknown;
  readonly tracked: boolean;
  workspace: string;
  owner: object | null;
  inUse: boolean;
  retained: boolean;
  inPlace: boolean;
  mode: SurfaceRetentionMode;
  keep: boolean;
  hidden: readonly HiddenNode[];
}

function liveRootNodes(entry: StashEntry): readonly Node[] {
  return entry.view.destroyed ? [] : entry.view.rootNodes;
}

function elementsOf(entry: StashEntry): HTMLElement[] {
  return liveRootNodes(entry).filter(
    (node): node is HTMLElement => node.nodeType === 1,
  );
}

function parkedInPlaceAt(entry: StashEntry, parent: Node | null): boolean {
  const nodes = liveRootNodes(entry);
  return (
    nodes.length > 0 &&
    nodes.every((node) => node.isConnected && node.parentNode === parent)
  );
}

function orphaned(entry: StashEntry): boolean {
  return (
    entry.inPlace && liveRootNodes(entry).some((node) => !node.isConnected)
  );
}

@Service()
export class RetainedViewStash implements OnDestroy {
  private readonly appRef = inject(ApplicationRef);
  private readonly document = inject(DOCUMENT);
  private readonly workspace = inject(ActiveWorkspaceService);
  private readonly atomicMove = supportsAtomicMove(this.document);
  private readonly entries = new Map<string, StashEntry>();
  private readonly changes = signal(0);
  private sweepQueued = false;
  private holdingArea: HTMLElement | null = null;

  readonly version: Signal<number> = this.changes.asReadonly();

  acquire(
    key: string,
    source: RetainedViewSource,
    create: () => RetainedViewHandle,
    parent: Node | null = null,
  ): RetainedSlot {
    const entry =
      this.claimableEntry(key, source, parent) ??
      this.createEntry(key, source, create);
    const attached = entry.inPlace && parkedInPlaceAt(entry, parent);
    this.reveal(entry);
    const token = {};
    entry.owner = token;
    entry.workspace = this.workspace.id();
    entry.inUse = true;
    entry.retained = false;
    entry.inPlace = false;
    this.bump();
    const owns = () => entry.owner === token;
    return {
      attached,
      get rootNodes(): readonly Node[] {
        return liveRootNodes(entry);
      },
      stale: () =>
        entry.tracked && (!owns() || this.entries.get(key) !== entry),
      describe: (mode: SurfaceRetentionMode, retain: boolean) => {
        if (!owns()) {
          return;
        }

        entry.mode = mode;
        entry.keep = retain;
      },
      release: (retained: boolean) => {
        if (owns()) {
          this.release(entry, retained);
        }
      },
      hide: (retained: boolean) => {
        if (owns()) {
          this.park(entry, retained);
        }
      },
      discard: () => {
        if (owns()) {
          this.discard(entry);
        }
      },
    };
  }

  parked(): ParkedEntry[] {
    return [...this.entries.values()]
      .filter((entry) => !entry.inUse)
      .map((entry) => ({
        key: entry.key,
        retained: entry.retained,
        workspace: entry.workspace,
        instance: entry.instance,
      }));
  }

  instances(): unknown[] {
    return [...this.entries.values()]
      .map((entry) => entry.instance)
      .filter((instance) => instance !== undefined);
  }

  keyedInstances(): { key: string; instance: unknown }[] {
    return [...this.entries.values()]
      .filter((entry) => entry.instance !== undefined)
      .map((entry) => ({ key: entry.key, instance: entry.instance }));
  }

  instancesFor(scope: string, path: string): unknown[] {
    const exact = `${scope}|${path}`;
    const prefix = `${exact}|`;
    return [...this.entries.values()]
      .filter((entry) => entry.key === exact || entry.key.startsWith(prefix))
      .map((entry) => entry.instance)
      .filter((instance) => instance !== undefined);
  }

  evacuate(scopePrefix: string): void {
    if (!this.atomicMove) {
      return;
    }
    for (const entry of this.entries.values()) {
      if (
        entry.inUse &&
        entry.keep &&
        entry.mode === 'in-place' &&
        entry.key.startsWith(scopePrefix)
      ) {
        this.moveToHoldingArea(entry);
      }
    }
  }

  evictParked(key: string): void {
    const entry = this.entries.get(key);
    if (entry && !entry.inUse) {
      this.destroyEntry(entry);
    }
  }

  evictWorkspace(workspaceId: string): void {
    const snapshot = [...this.entries.values()];
    for (const entry of snapshot) {
      if (!entry.inUse && entry.workspace === workspaceId) {
        this.destroyEntry(entry);
      }
    }
  }

  ngOnDestroy(): void {
    const snapshot = [...this.entries.values()];
    for (const entry of snapshot) {
      this.destroyEntry(entry);
    }
    this.holdingArea?.remove();
    this.holdingArea = null;
  }

  private claimableEntry(
    key: string,
    source: RetainedViewSource,
    parent: Node | null,
  ): StashEntry | null {
    const entry = this.entries.get(key);
    if (!entry) {
      return null;
    }
    if (entry.inUse) {
      return entry.source === source && !entry.view.destroyed ? entry : null;
    }
    const reclaimable =
      entry.source === source &&
      !entry.view.destroyed &&
      (!entry.inPlace ||
        parkedInPlaceAt(entry, parent) ||
        this.relocatable(entry));
    if (!reclaimable) {
      this.destroyEntry(entry);
      return null;
    }
    return entry;
  }

  private createEntry(
    key: string,
    source: RetainedViewSource,
    create: () => RetainedViewHandle,
  ): StashEntry {
    const occupied = this.entries.get(key)?.inUse === true;
    const { view, instance } = create();
    this.appRef.attachView(view);
    const entry: StashEntry = {
      key,
      source,
      view,
      instance,
      tracked: !occupied,
      workspace: this.workspace.id(),
      owner: null,
      inUse: false,
      retained: false,
      inPlace: false,
      mode: 'move',
      keep: false,
      hidden: [],
    };
    if (entry.tracked) {
      this.entries.set(key, entry);
    }
    return entry;
  }

  private release(entry: StashEntry, retained: boolean): void {
    if (!entry.inUse) {
      return;
    }
    this.pullNodes(entry);
    this.detain(entry, retained);
  }

  private park(entry: StashEntry, retained: boolean): void {
    if (!entry.inUse) {
      return;
    }
    if (retained && this.atomicMove) {
      this.moveToHoldingArea(entry);
    }
    entry.hidden = elementsOf(entry).map((element) => {
      const display = element.style.display;
      element.style.display = 'none';
      return { element, display };
    });
    entry.inPlace = true;
    this.detain(entry, retained);
  }

  private detain(entry: StashEntry, retained: boolean): void {
    entry.inUse = false;
    entry.owner = null;
    if (!entry.tracked) {
      this.destroyEntry(entry);
      return;
    }
    entry.retained = retained;
    this.bump();
    this.queueSweep();
  }

  private reveal(entry: StashEntry): void {
    for (const { element, display } of entry.hidden) {
      element.style.display = display;
    }
    entry.hidden = [];
  }

  private relocatable(entry: StashEntry): boolean {
    return (
      this.atomicMove && liveRootNodes(entry).every((node) => node.isConnected)
    );
  }

  private moveToHoldingArea(entry: StashEntry): void {
    const area = this.holdingAreaElement();
    for (const node of liveRootNodes(entry)) {
      if (node.parentNode !== area) {
        moveNode(area, node, null);
      }
    }
  }

  private holdingAreaElement(): HTMLElement {
    if (this.holdingArea?.isConnected) {
      return this.holdingArea;
    }
    const area = this.document.createElement('div');
    area.dataset['lwRetentionHold'] = '';
    area.style.display = 'none';
    this.document.body.append(area);
    this.holdingArea = area;
    return area;
  }

  private discard(entry: StashEntry): void {
    entry.inUse = false;
    entry.owner = null;
    this.destroyEntry(entry);
  }

  private pullNodes(entry: StashEntry): void {
    for (const node of liveRootNodes(entry)) {
      (node as ChildNode).remove();
    }
  }

  private destroyEntry(entry: StashEntry): void {
    this.pullNodes(entry);
    if (this.entries.get(entry.key) === entry) {
      this.entries.delete(entry.key);
    }
    if (!entry.view.destroyed) {
      this.appRef.detachView(entry.view);
      entry.view.destroy();
    }
    this.bump();
  }

  private bump(): void {
    this.changes.update((value) => value + 1);
  }

  private queueSweep(): void {
    if (this.sweepQueued) {
      return;
    }
    this.sweepQueued = true;
    queueMicrotask(() => {
      this.sweepQueued = false;
      const snapshot = [...this.entries.values()];
      for (const entry of snapshot) {
        if (entry.inUse) {
          continue;
        }
        if (
          orphaned(entry) ||
          (!entry.retained && !instanceDirty(entry.instance))
        ) {
          this.destroyEntry(entry);
        }
      }
    });
  }
}

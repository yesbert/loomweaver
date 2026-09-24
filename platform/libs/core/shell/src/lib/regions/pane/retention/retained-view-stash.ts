import { DOCUMENT } from '@angular/common';
import {
  ApplicationRef,
  inject,
  OnDestroy,
  Service,
  signal,
  Signal,
} from '@angular/core';
import { ActiveWorkspaceService } from '../../../workspace/active-workspace.service';
import { supportsAtomicMove } from './atomic-move';
import { SurfaceRetentionMode, instanceDirty } from './retention-policy';
import {
  ParkedEntry,
  RetainedSlot,
  RetainedViewHandle,
  RetainedViewSource,
  SlotPlacement,
} from './retained-view-model';
import {
  adoptHeld,
  elementsOf,
  endHoldsIn,
  heldInUseElsewhere,
  instancesAt,
  instancesOf,
  isHeld,
  keyedInstancesOf,
  lastHolder,
  liveRootNodes,
  orphaned,
  parkedEntriesOf,
  parkedInPlaceAt,
  parkedInstancesIn,
  StashEntry,
} from './stash-entries';
import { SurfaceHoldState } from './surface-hold';
import { HoldingArea, hideElements, revealElements } from './holding-area';

@Service()
export class RetainedViewStash implements OnDestroy {
  private readonly appRef = inject(ApplicationRef);
  private readonly document = inject(DOCUMENT);
  private readonly workspace = inject(ActiveWorkspaceService);
  private readonly atomicMove = supportsAtomicMove(this.document);
  private readonly entries = new Map<string, StashEntry>();
  private readonly changes = signal(0);
  private sweepQueued = false;
  private readonly holdingArea = new HoldingArea(this.document);

  readonly version: Signal<number> = this.changes.asReadonly();

  acquire(
    key: string,
    source: RetainedViewSource,
    create: () => RetainedViewHandle,
    { parent = null, hold = null }: SlotPlacement = {},
  ): RetainedSlot {
    const entry =
      this.claimableEntry(key, source, parent) ??
      adoptHeld(this.entries, key, hold) ??
      this.createEntry(key, source, create);
    const attached = entry.inPlace && parkedInPlaceAt(entry, parent);
    this.showNodes(entry);
    const token = {};
    entry.owner = token;
    entry.workspace = this.workspace.id();
    entry.inUse = true;
    entry.retains = false;
    entry.inPlace = false;
    entry.deferred = null;
    this.bump();
    return this.slotFor(entry, token, attached);
  }

  parked(): ParkedEntry[] {
    return parkedEntriesOf(this.entries.values());
  }

  heldElsewhere(key: string, hold: SurfaceHoldState | null): boolean {
    return heldInUseElsewhere(this.entries.values(), key, hold);
  }

  instances(): unknown[] {
    return instancesOf(this.entries.values());
  }

  parkedInstancesOf(workspaceId: string): unknown[] {
    return parkedInstancesIn(this.entries.values(), workspaceId);
  }

  keyedInstances(): { key: string; instance: unknown }[] {
    return keyedInstancesOf(this.entries.values());
  }

  instancesFor(scope: string, path: string): unknown[] {
    return instancesAt(this.entries.values(), scope, path);
  }

  evacuate(matches: (key: string) => boolean): void {
    if (!this.atomicMove) {
      return;
    }
    let moved = false;
    for (const entry of this.entries.values()) {
      if (
        !entry.inUse ||
        !entry.retains ||
        entry.mode !== 'in-place' ||
        isHeld(entry) ||
        !matches(entry.key)
      ) {
        continue;
      }
      this.holdingArea.moveInto(liveRootNodes(entry));
      moved = true;
    }
    if (moved) {
      this.bump();
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

  endHolds(workspaceId: string): void {
    endHoldsIn(this.entries.values(), workspaceId);
  }

  ngOnDestroy(): void {
    const snapshot = [...this.entries.values()];
    for (const entry of snapshot) {
      this.destroyEntry(entry);
    }
    this.holdingArea.remove();
  }

  private slotFor(
    entry: StashEntry,
    token: object,
    attached: boolean,
  ): RetainedSlot {
    const key = entry.key;
    const owns = () => entry.owner === token;
    return {
      attached,
      get rootNodes(): readonly Node[] {
        return liveRootNodes(entry);
      },
      stale: () =>
        entry.tracked && (!owns() || this.entries.get(key) !== entry),
      held: () => isHeld(entry),
      describe: (mode: SurfaceRetentionMode, retains: boolean) => {
        if (!owns()) {
          return;
        }
        entry.mode = mode;
        entry.retains = retains;
      },
      detach: (retains: boolean) => {
        if (owns()) {
          this.detachEntry(entry, retains);
        }
      },
      hideInPlace: (retains: boolean) => {
        if (owns()) {
          this.parkInPlace(entry, retains);
        }
      },
      discard: () => {
        if (owns()) {
          this.discard(entry);
        }
      },
    };
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
    const { view, instance, hold = null } = create();
    this.appRef.attachView(view);
    const entry: StashEntry = {
      key,
      source,
      view,
      instance,
      tracked: !occupied,
      hold,
      workspace: this.workspace.id(),
      owner: null,
      inUse: false,
      retains: false,
      inPlace: false,
      mode: 'move',
      hidden: [],
      deferred: null,
      unlisten: () => undefined,
    };
    if (hold) {
      entry.unlisten = hold.onRelease(() => this.applyDeferredPlacement(entry));
    }
    if (entry.tracked) {
      this.entries.set(key, entry);
    }
    return entry;
  }

  private detachEntry(entry: StashEntry, retains: boolean): void {
    if (!entry.inUse) {
      return;
    }
    if (isHeld(entry)) {
      entry.deferred = 'detach';
    } else {
      this.pullNodes(entry);
    }
    this.letGoOf(entry, retains);
  }

  private parkInPlace(entry: StashEntry, retains: boolean): void {
    if (!entry.inUse) {
      return;
    }
    entry.retains = retains;
    if (isHeld(entry)) {
      entry.deferred = 'hideInPlace';
      entry.inPlace = false;
    } else {
      this.hideNodes(entry);
    }
    this.letGoOf(entry, retains);
  }

  private hideNodes(entry: StashEntry): void {
    if (entry.retains && this.atomicMove) {
      this.holdingArea.moveInto(liveRootNodes(entry));
    }
    entry.hidden = hideElements(elementsOf(entry));
    entry.inPlace = true;
  }

  private showNodes(entry: StashEntry): void {
    revealElements(entry.hidden);
    entry.hidden = [];
  }

  private applyDeferredPlacement(entry: StashEntry): void {
    const deferred = entry.deferred;
    entry.deferred = null;
    if (!entry.inUse && deferred !== null) {
      if (deferred === 'detach') {
        this.pullNodes(entry);
      } else {
        this.hideNodes(entry);
      }
      this.queueSweep();
    }
    this.bump();
  }

  private letGoOf(entry: StashEntry, retains: boolean): void {
    entry.inUse = false;
    entry.owner = null;
    if (!entry.tracked) {
      this.destroyEntry(entry);
      return;
    }
    entry.retains = retains;
    this.bump();
    this.queueSweep();
  }

  private relocatable(entry: StashEntry): boolean {
    return (
      this.atomicMove && liveRootNodes(entry).every((node) => node.isConnected)
    );
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
    entry.unlisten();
    this.pullNodes(entry);
    if (this.entries.get(entry.key) === entry) {
      this.entries.delete(entry.key);
    }
    if (lastHolder(entry, this.entries.values())) {
      entry.hold?.end();
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
        if (entry.inUse || isHeld(entry)) {
          continue;
        }
        if (
          orphaned(entry) ||
          (!entry.retains && !instanceDirty(entry.instance))
        ) {
          this.destroyEntry(entry);
        }
      }
    });
  }
}

import { EmbeddedViewRef, Injector } from '@angular/core';
import { SurfaceRetentionMode } from './retention-policy';
import {
  ParkedEntry,
  RetainedViewHandle,
  RetainedViewSource,
} from './retained-view-model';
import { SurfaceHoldState } from './surface-hold';
import { instanceDirty } from '../unsaved-work/dirty-surface';
import { isKeyForSurface, isPrimaryRetentionKey } from './retention-keys';
import {
  HiddenNode,
  HoldingArea,
  hideElements,
  revealElements,
} from './holding-area';

export type DeferredPlacement = 'detach' | 'hideInPlace';

const SLOT_SEPARATOR = '\n';

export interface StashEntry {
  key: string;
  readonly source: RetainedViewSource;
  readonly view: EmbeddedViewRef<unknown>;
  readonly instance?: unknown;
  readonly injector: Injector | null;
  readonly tracked: boolean;
  readonly hold: SurfaceHoldState | null;
  workspace: string;
  owner: object | null;
  inUse: boolean;
  retains: boolean;
  inPlace: boolean;
  mode: SurfaceRetentionMode;
  hidden: readonly HiddenNode[];
  deferred: DeferredPlacement | null;
  unlisten: () => void;
}

export function newEntry(
  key: string,
  source: RetainedViewSource,
  built: RetainedViewHandle,
  workspace: string,
  tracked: boolean,
): StashEntry {
  return {
    key,
    source,
    view: built.view,
    instance: built.instance,
    injector: built.injector ?? null,
    tracked,
    hold: built.hold ?? null,
    workspace,
    owner: null,
    inUse: false,
    retains: false,
    inPlace: false,
    mode: 'move',
    hidden: [],
    deferred: null,
    unlisten: () => undefined,
  };
}

export function slotOf(workspaceId: string, key: string): string {
  return isPrimaryRetentionKey(key)
    ? key
    : `${workspaceId}${SLOT_SEPARATOR}${key}`;
}

export function shownOrParkedIn(
  entries: Iterable<StashEntry>,
  workspaceId: string,
): StashEntry[] {
  return [...entries].filter(
    (entry) => entry.inUse || entry.workspace === workspaceId,
  );
}

export function adoptInUse(
  entries: Map<string, StashEntry>,
  workspaceId: string,
): StashEntry[] {
  const displaced: StashEntry[] = [];
  const elsewhere = [...entries.values()].filter(
    (entry) => entry.inUse && entry.workspace !== workspaceId,
  );
  for (const entry of elsewhere) {
    const slot = slotOf(workspaceId, entry.key);
    if (entries.has(slot) && entries.get(slot) !== entry) {
      displaced.push(entry);
      continue;
    }
    entries.delete(slotOf(entry.workspace, entry.key));
    entry.workspace = workspaceId;
    entries.set(slot, entry);
  }
  return displaced;
}

export function homeless(
  entry: StashEntry,
  gone: ReadonlySet<string>,
): boolean {
  return (
    !entry.tracked ||
    (gone.has(entry.workspace) && !isPrimaryRetentionKey(entry.key))
  );
}

export function evacuable(entry: StashEntry): boolean {
  return (
    (entry.inUse || entry.inPlace) &&
    (entry.retains || instanceDirty(entry.instance)) &&
    entry.mode === 'in-place' &&
    !isHeld(entry)
  );
}

export function liveRootNodes(entry: StashEntry): readonly Node[] {
  return entry.view.destroyed ? [] : entry.view.rootNodes;
}

export function elementsOf(entry: StashEntry): HTMLElement[] {
  return liveRootNodes(entry).filter(
    (node): node is HTMLElement => node.nodeType === 1,
  );
}

export function parkedInPlaceAt(
  entry: StashEntry,
  parent: Node | null,
): boolean {
  const nodes = liveRootNodes(entry);
  return (
    nodes.length > 0 &&
    nodes.every((node) => node.isConnected && node.parentNode === parent)
  );
}

export function pullNodes(entry: StashEntry): void {
  for (const node of liveRootNodes(entry)) {
    (node as ChildNode).remove();
  }
}

export function hideNodes(
  entry: StashEntry,
  holding: HoldingArea | null,
): void {
  if (entry.retains && holding) {
    holding.moveInto(liveRootNodes(entry));
  }
  entry.hidden = hideElements(elementsOf(entry));
  entry.inPlace = true;
}

export function showNodes(entry: StashEntry): void {
  revealElements(entry.hidden);
  entry.hidden = [];
}

export function reclaimable(
  entry: StashEntry,
  source: RetainedViewSource,
  parent: Node | null,
  atomicMove: boolean,
): boolean {
  return (
    entry.source === source &&
    !entry.view.destroyed &&
    (!entry.inPlace ||
      parkedInPlaceAt(entry, parent) ||
      (atomicMove && liveRootNodes(entry).every((node) => node.isConnected)))
  );
}

export function spent(entry: StashEntry): boolean {
  return (
    !entry.inUse &&
    !isHeld(entry) &&
    (orphaned(entry) || (!entry.retains && !instanceDirty(entry.instance)))
  );
}

export function orphaned(entry: StashEntry): boolean {
  return (
    entry.inPlace && liveRootNodes(entry).some((node) => !node.isConnected)
  );
}

export function isHeld(entry: StashEntry): boolean {
  return entry.hold?.held() === true;
}

function holderOf(
  entries: Iterable<StashEntry>,
  hold: SurfaceHoldState | null,
): StashEntry | undefined {
  if (!hold?.held()) {
    return undefined;
  }
  return [...entries].find((entry) => entry.hold === hold);
}

export function heldInUseElsewhere(
  entries: Iterable<StashEntry>,
  key: string,
  hold: SurfaceHoldState | null,
): boolean {
  const holder = holderOf(entries, hold);
  return holder !== undefined && holder.inUse && holder.key !== key;
}

export function adoptHeld(
  entries: Map<string, StashEntry>,
  key: string,
  hold: SurfaceHoldState | null,
  workspaceId: string,
): StashEntry | null {
  const holder = holderOf(entries.values(), hold);
  if (!holder || holder.inUse) {
    return null;
  }
  entries.delete(slotOf(holder.workspace, holder.key));
  holder.key = key;
  holder.workspace = workspaceId;
  entries.set(slotOf(workspaceId, key), holder);
  return holder;
}

export function rekeyEntries(
  entries: Map<string, StashEntry>,
  workspaceId: string,
  rename: (key: string) => string,
): StashEntry[] {
  const moved: StashEntry[] = [];
  const snapshot = [...entries.values()];
  for (const entry of snapshot) {
    const key = rename(entry.key);
    const slot = slotOf(workspaceId, key);
    if (
      entry.workspace !== workspaceId ||
      key === entry.key ||
      entries.has(slot)
    ) {
      continue;
    }
    entries.delete(slotOf(workspaceId, entry.key));
    entry.key = key;
    entries.set(slot, entry);
    moved.push(entry);
  }
  return moved;
}

export function parkedEntriesOf(entries: Iterable<StashEntry>): ParkedEntry[] {
  return [...entries]
    .filter((entry) => !entry.inUse)
    .map((entry) => ({
      key: entry.key,
      retains: entry.retains,
      held: isHeld(entry),
      workspace: entry.workspace,
      instance: entry.instance,
    }));
}

export function instancesOf(entries: Iterable<StashEntry>): unknown[] {
  return [...entries]
    .map((entry) => entry.instance)
    .filter((instance) => instance !== undefined);
}

export function keyedInstancesOf(
  entries: Iterable<StashEntry>,
): { key: string; instance: unknown }[] {
  return [...entries]
    .filter((entry) => entry.instance !== undefined)
    .map((entry) => ({ key: entry.key, instance: entry.instance }));
}

export function parkedInstancesIn(
  entries: Iterable<StashEntry>,
  workspaceId: string,
): unknown[] {
  return [...entries]
    .filter((entry) => !entry.inUse && entry.workspace === workspaceId)
    .map((entry) => entry.instance)
    .filter((instance) => instance !== undefined);
}

export function instancesAt(
  entries: Iterable<StashEntry>,
  scope: string,
  path: string,
): unknown[] {
  return [...entries]
    .filter((entry) => isKeyForSurface(entry.key, scope, path))
    .map((entry) => entry.instance)
    .filter((instance) => instance !== undefined);
}

export function uncarried(
  entries: Map<string, StashEntry>,
  workspaceId: string,
  rename: (key: string) => string,
  atomicMove: boolean,
): unknown[] {
  return instancesOf(
    [...entries.values()].filter((entry) => {
      const key = rename(entry.key);
      return (
        entry.workspace === workspaceId &&
        key !== entry.key &&
        (entries.has(slotOf(workspaceId, key)) ||
          (!atomicMove && entry.mode === 'in-place'))
      );
    }),
  );
}

export function lastHolder(
  entry: StashEntry,
  entries: Iterable<StashEntry>,
): boolean {
  return [...entries].every((other) => other.hold !== entry.hold);
}

export function endHoldsIn(
  entries: Iterable<StashEntry>,
  workspaceId: string,
): void {
  for (const entry of entries) {
    if (entry.workspace === workspaceId) {
      entry.hold?.end();
    }
  }
}

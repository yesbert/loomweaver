import { EmbeddedViewRef } from '@angular/core';
import { SurfaceRetentionMode } from './retention-policy';
import { ParkedEntry, RetainedViewSource } from './retained-view-model';
import { SurfaceHoldState } from './surface-hold';
import { isKeyForSurface } from './retention-keys';
import { HiddenNode } from './holding-area';

export type DeferredPlacement = 'detach' | 'hideInPlace';

export interface StashEntry {
  key: string;
  readonly source: RetainedViewSource;
  readonly view: EmbeddedViewRef<unknown>;
  readonly instance?: unknown;
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
): StashEntry | null {
  const holder = holderOf(entries.values(), hold);
  if (!holder || holder.inUse) {
    return null;
  }
  entries.delete(holder.key);
  holder.key = key;
  entries.set(key, holder);
  return holder;
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

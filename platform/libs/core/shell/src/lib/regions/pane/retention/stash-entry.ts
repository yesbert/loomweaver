import { EmbeddedViewRef } from '@angular/core';
import { SurfaceRetentionMode } from './retention-policy';
import { RetainedViewSource } from './retained-view-model';
import { SurfaceHoldState } from './surface-hold';

export interface HiddenNode {
  readonly element: HTMLElement;
  readonly display: string;
}

export type DeferredPlacement =
  | { readonly kind: 'release' }
  | { readonly kind: 'park'; readonly retained: boolean };

export interface StashEntry {
  readonly key: string;
  readonly source: RetainedViewSource;
  readonly view: EmbeddedViewRef<unknown>;
  readonly instance?: unknown;
  readonly tracked: boolean;
  readonly hold: SurfaceHoldState | null;
  workspace: string;
  owner: object | null;
  inUse: boolean;
  retained: boolean;
  inPlace: boolean;
  mode: SurfaceRetentionMode;
  keep: boolean;
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

export function parkedInPlaceAt(entry: StashEntry, parent: Node | null): boolean {
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

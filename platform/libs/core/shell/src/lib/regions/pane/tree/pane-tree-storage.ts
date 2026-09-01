import { DOCUMENT } from '@angular/common';
import { inject, isDevMode, Service } from '@angular/core';
import { WORKING_STATE_STORE } from '../../../persistence/working-state-store';
import { hydrateAsync } from '../../../persistence/hydrate';
import { isPopoutUrl } from '../../../popout/popout-path';
import { ActiveWorkspaceService } from '../../../workspace/active-workspace.service';
import {
  DockEntry,
  normalizeDockEntry,
  withoutBorrowedLabels,
  withoutTabs,
} from './pane-restore';
import { PaneNode } from './pane-node';
import { WORKSPACE_DEFINITIONS } from '../../../workspace/provide-workspaces';
import {
  claimsOf,
  declaredTabPaths,
} from '../../../workspace/workspace-definition';
import {
  claimFor,
  withoutConflicts,
} from '../../../workspace/workspace-claims';

const STORAGE_KEY = 'lw.shell.pane-trees';

const WORKSPACES_KEY = 'lw.shell.workspaces';

const HYDRATION_RETRY_MS = 500;

export function isDefault(entry: DockEntry): boolean {
  return entry.node.kind === 'leaf' && entry.node.tabs.length === 0;
}

function parse(raw: string | undefined): Record<string, DockEntry> {
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, DockEntry> = {};
    for (const [dock, value] of Object.entries(parsed ?? {})) {
      const entry = normalizeDockEntry(value);
      if (entry && !isDefault(entry)) {
        out[dock] = entry;
      }
    }
    return out;
  } catch {
    return {};
  }
}

function originsIn(raw: string | undefined): ReadonlyMap<string, string> {
  const origins = new Map<string, string>();
  if (!raw) {
    return origins;
  }
  try {
    for (const saved of JSON.parse(raw) as readonly unknown[]) {
      const entry = saved as { id?: unknown; origin?: unknown };
      if (typeof entry.id === 'string' && typeof entry.origin === 'string') {
        origins.set(entry.id, entry.origin);
      }
    }
  } catch {
    return origins;
  }
  return origins;
}

function serializeDocks(docks: Record<string, DockEntry>): string {
  const out: Record<string, { tree: PaneNode; primary: string }> = {};
  for (const [dock, entry] of Object.entries(docks)) {
    out[dock] = { tree: entry.node, primary: entry.primary };
  }
  return JSON.stringify(out);
}

@Service()
export class PaneTreeStorage {
  private readonly store = inject(WORKING_STATE_STORE);
  private readonly workspace = inject(ActiveWorkspaceService);

  private readonly definitions = inject(WORKSPACE_DEFINITIONS, {
    optional: true,
  })?.flat();

  private readonly popout = isPopoutUrl(
    inject(DOCUMENT).location?.pathname ?? '',
  );

  peek(): Record<string, DockEntry> {
    return this.settled(parse(this.store.peek?.(this.key())));
  }

  hydrate(
    apply: (raw: string | undefined) => void,
    settled: () => void,
  ): void {
    if (this.store.peek) {
      settled();
      return;
    }
    void this.workspace.ready.then(() =>
      hydrateAsync(this.store, this.key(), apply, (loaded) => {
        if (loaded) {
          settled();
          return;
        }
        this.retryOnce(apply, settled);
      }),
    );
  }

  save(docks: Record<string, DockEntry>): void {
    if (this.popout) {
      return;
    }
    void this.store.set(this.key(), serializeDocks(docks));
  }

  serialize(docks: Record<string, DockEntry>): string {
    return serializeDocks(docks);
  }

  parsed(raw: string | undefined): Record<string, DockEntry> {
    return this.settled(parse(raw));
  }

  private settled(
    docks: Record<string, DockEntry>,
  ): Record<string, DockEntry> {
    const declared = this.definitions ?? [];
    const here = this.declaredHome();
    if (declared.every((definition) => definition.id !== here)) {
      return docks;
    }
    const claims = withoutConflicts(claimsOf(declared));
    const home = declared.find((definition) => definition.id === here);
    const ownTabs = home ? declaredTabPaths(home) : [];
    const isDeclared = (path: string) =>
      ownTabs.some((own) => path === own || path.startsWith(`${own}/`));
    const out: Record<string, DockEntry> = {};
    const dropped: string[] = [];
    const stripped: string[] = [];
    for (const [dock, entry] of Object.entries(docks)) {
      const filtered = withoutTabs(
        entry.node,
        (path) => (claimFor(claims, path)?.workspaceId ?? here) !== here,
      );
      dropped.push(...filtered.dropped);
      const relabelled = withoutBorrowedLabels(
        filtered.node,
        (tab) =>
          tab.title !== undefined &&
          tab.literalTitle !== true &&
          isDeclared(tab.path),
      );
      stripped.push(...relabelled.stripped);
      const repaired = { ...entry, node: relabelled.node };
      if (!isDefault(repaired)) {
        out[dock] = repaired;
      }
    }
    if (isDevMode() && (dropped.length > 0 || stripped.length > 0)) {
      this.reportRepair(dropped, stripped);
    }
    return out;
  }

  private reportRepair(
    dropped: readonly string[],
    stripped: readonly string[],
  ): void {
    const quoted = (paths: readonly string[]) =>
      paths.map((path) => `"${path}"`).join(', ');
    const notes: string[] = [];
    if (dropped.length > 0) {
      notes.push(
        `stored content at ${quoted(dropped)} belongs to another workspace ` +
          `that claims it — the tab is dropped rather than restored here`,
      );
    }
    if (stripped.length > 0) {
      notes.push(
        `stored labels on ${quoted(stripped)} were worked out rather than ` +
          `carried — they are dropped so the tab is labelled from its own content`,
      );
    }
    console.warn(`Workspace "${this.workspace.id()}": ${notes.join('; ')}.`);
  }

  private declaredHome(): string {
    const active = this.workspace.id();
    return originsIn(this.store.peek?.(WORKSPACES_KEY)).get(active) ?? active;
  }

  private key(): string {
    return this.workspace.scopedKey(STORAGE_KEY);
  }

  private retryOnce(
    apply: (raw: string | undefined) => void,
    settled: () => void,
  ): void {
    setTimeout(() => {
      void this.store
        .get(this.key())
        .then((raw) => {
          apply(raw);
          settled();
        })
        .catch(() => undefined);
    }, HYDRATION_RETRY_MS);
  }
}

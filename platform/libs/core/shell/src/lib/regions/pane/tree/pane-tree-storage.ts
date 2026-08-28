import { DOCUMENT } from '@angular/common';
import { inject, Service } from '@angular/core';
import { WORKING_STATE_STORE } from '../../../persistence/working-state-store';
import { hydrateAsync } from '../../../persistence/hydrate';
import { isPopoutUrl } from '../../../popout/popout-path';
import { ActiveWorkspaceService } from '../../../workspace/active-workspace.service';
import { DockEntry, normalizeDockEntry } from './pane-restore';
import { PaneNode } from './pane-node';

const STORAGE_KEY = 'lw.shell.pane-trees';

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

  private readonly popout = isPopoutUrl(
    inject(DOCUMENT).location?.pathname ?? '',
  );

  peek(): Record<string, DockEntry> {
    return parse(this.store.peek?.(this.key()));
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
    return parse(raw);
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

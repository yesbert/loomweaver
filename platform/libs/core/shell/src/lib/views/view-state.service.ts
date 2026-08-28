import { inject, Service, signal, WritableSignal } from '@angular/core';
import { ViewState } from '@loomweaver/plugin-sdk';
import { WORKING_STATE_STORE } from '../persistence/working-state-store';
import { hydrateAsync } from '../persistence/hydrate';
import { StateSyncService } from '../persistence/state-sync.service';

const STORAGE_PREFIX = 'lw.shell.view-state:';
const SAVE_DEBOUNCE_MS = 400;

function parseBlob(raw: string | undefined): unknown {
  if (!raw) {
    return undefined;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

interface Entry {
  readonly value: WritableSignal<unknown>;
  save(): void;
  cancelPendingSave(): void;
}

@Service()
export class ViewStateService {
  private readonly store = inject(WORKING_STATE_STORE);
  private readonly sync = inject(StateSyncService);
  private readonly entries = new Map<string, Entry>();

  constructor() {
    this.sync.registerPrefix('working-state', STORAGE_PREFIX, (raw, key) => {
      const entry = this.entries.get(key.slice(STORAGE_PREFIX.length));
      if (!entry) {
        return;
      }
      entry.cancelPendingSave();
      entry.value.set(parseBlob(raw));
    });
  }

  clear(instanceId: string): void {
    this.entries.get(instanceId)?.cancelPendingSave();
    this.entries.delete(instanceId);
    void this.store.delete(STORAGE_PREFIX + instanceId);
  }

  reset(instanceId: string): void {
    const entry = this.entries.get(instanceId);
    entry?.cancelPendingSave();
    entry?.value.set(undefined);
    void this.store.delete(STORAGE_PREFIX + instanceId);
  }

  handle(instanceId: string): ViewState {
    const entry = this.entryFor(instanceId);
    return {
      instanceId,
      value: () => entry.value(),
      set: (next) => {
        entry.value.set(next);
        entry.save();
      },
    };
  }

  private entryFor(instanceId: string): Entry {
    const existing = this.entries.get(instanceId);
    if (existing) {
      return existing;
    }
    const key = STORAGE_PREFIX + instanceId;
    const value = signal<unknown>(parseBlob(this.store.peek?.(key)));
    hydrateAsync(this.store, key, (raw) => value.set(parseBlob(raw)));
    let timer: ReturnType<typeof setTimeout> | undefined;
    const cancelPendingSave = () => {
      if (timer !== undefined) {
        clearTimeout(timer);
        timer = undefined;
      }
    };
    const save = () => {
      cancelPendingSave();
      timer = setTimeout(() => {
        timer = undefined;
        const current = value();
        if (current !== undefined) {
          void this.store.set(key, JSON.stringify(current));
        }
      }, SAVE_DEBOUNCE_MS);
    };
    const entry: Entry = { value, save, cancelPendingSave };
    this.entries.set(instanceId, entry);
    return entry;
  }
}

import { inject, Service, signal, WritableSignal } from '@angular/core';
import { ViewState } from '@loomweaver/plugin-sdk';
import { HeldWrites } from '../persistence/held-writes/held-writes';
import { WORKING_STATE_STORE } from '../persistence/working-state-store';
import { hydrateAsync, readStoredValue } from '../persistence/stored-values/hydrate';
import { StateSyncService } from '../persistence/cross-tab/state-sync.service';
import { parseStored } from '../persistence/stored-values/parse-stored';

const STORAGE_PREFIX = 'lw.shell.view-state:';

interface Entry {
  readonly value: WritableSignal<unknown>;
  save(): void;
  cancelPendingSave(): void;
}

@Service()
export class ViewStateService {
  private readonly store = inject(WORKING_STATE_STORE);
  private readonly sync = inject(StateSyncService);
  private readonly heldWrites = inject(HeldWrites);
  private readonly entries = new Map<string, Entry>();

  constructor() {
    this.sync.registerPrefix('working-state', STORAGE_PREFIX, (raw, key) => {
      const entry = this.entries.get(key.slice(STORAGE_PREFIX.length));
      if (!entry) {
        return;
      }
      entry.cancelPendingSave();
      entry.value.set(parseStored(raw));
    });
    this.sync.onNamespaceAdopted(() => this.rereadEntries());
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

  private async rereadEntries(): Promise<void> {
    for (const [instanceId, entry] of this.entries) {
      const raw = await readStoredValue(
        this.store,
        STORAGE_PREFIX + instanceId,
      );
      entry.cancelPendingSave();
      entry.value.set(parseStored(raw));
    }
  }

  private entryFor(instanceId: string): Entry {
    const existing = this.entries.get(instanceId);
    if (existing) {
      return existing;
    }
    const entry = this.entryOn(STORAGE_PREFIX + instanceId);
    this.entries.set(instanceId, entry);
    return entry;
  }

  private entryOn(key: string): Entry {
    const value = signal<unknown>(parseStored(this.store.peek?.(key)));
    let answered = this.store.peek !== undefined;
    let writtenEarly = false;
    const hold = () => {
      const current = value();
      if (current === undefined) {
        this.heldWrites.cancel(key);
        void this.store.delete(key);
        return;
      }
      this.heldWrites.hold(key, JSON.stringify(current), (held) => {
        void this.store.set(key, held);
      });
    };
    const adopt = (raw: string | undefined) => {
      if (answered) {
        return;
      }
      answered = true;
      const stored = parseStored(raw);
      if (stored !== undefined) {
        value.set(stored);
      } else if (writtenEarly) {
        hold();
      }
    };
    hydrateAsync(this.store, key, adopt, (loaded) => {
      if (!loaded) {
        adopt(undefined);
      }
    });
    return {
      value,
      save: () => {
        if (answered) {
          hold();
        } else {
          writtenEarly = true;
        }
      },
      cancelPendingSave: () => {
        answered = true;
        this.heldWrites.cancel(key);
      },
    };
  }
}

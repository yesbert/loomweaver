import { inject, Service, signal } from '@angular/core';
import { SETTINGS_STORE } from '../../persistence/settings-store';
import { hydrateAsync } from '../../persistence/hydrate';
import { StateSyncService } from '../../persistence/state-sync.service';

const STORAGE_KEY = 'lw.shell.rail-labels';

type RailLabels = Readonly<Record<string, boolean>>;

const EMPTY: RailLabels = {};

function parse(raw: string | undefined): RailLabels {
  if (!raw) {
    return EMPTY;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return EMPTY;
    }
    const labels: Record<string, boolean> = {};
    for (const [railId, value] of Object.entries(
      parsed as Record<string, unknown>,
    )) {
      if (value === true) {
        labels[railId] = true;
      }
    }
    return labels;
  } catch {
    return EMPTY;
  }
}

@Service()
export class RailLabelsService {
  private readonly store = inject(SETTINGS_STORE);
  private readonly sync = inject(StateSyncService);
  private readonly state = signal<RailLabels>(
    parse(this.store.peek?.(STORAGE_KEY)),
  );

  constructor() {
    hydrateAsync(this.store, STORAGE_KEY, (raw) => this.state.set(parse(raw)));
    this.sync.register('settings', STORAGE_KEY, (raw) =>
      this.state.set(parse(raw)),
    );
  }

  labelled(railId: string): boolean {
    return this.state()[railId] === true;
  }

  show(railId: string, labelled: boolean): void {
    const next = { ...this.state() };
    if (labelled) {
      next[railId] = true;
    } else {
      delete next[railId];
    }
    this.state.set(next);
    void this.store.set(STORAGE_KEY, JSON.stringify(next));
  }
}

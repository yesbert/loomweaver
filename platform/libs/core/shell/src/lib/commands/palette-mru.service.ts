import { inject, Service, signal } from '@angular/core';
import { WORKING_STATE_STORE } from '../persistence/working-state-store';
import { hydrateAsync } from '../persistence/hydrate';
import { StateSyncService } from '../persistence/state-sync.service';

const STORAGE_KEY = 'lw.shell.command-mru';
const LIMIT = 8;

function parseMru(raw: string | undefined): readonly string[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    const ids = parsed.filter((entry): entry is string => {
      return typeof entry === 'string';
    });
    return [...new Set(ids)].slice(0, LIMIT);
  } catch {
    return [];
  }
}

@Service()
export class PaletteMruService {
  private readonly store = inject(WORKING_STATE_STORE);
  private readonly sync = inject(StateSyncService);

  private readonly state = signal<readonly string[]>(
    parseMru(this.store.peek?.(STORAGE_KEY)),
  );

  readonly ids = this.state.asReadonly();

  constructor() {
    hydrateAsync(this.store, STORAGE_KEY, (raw) =>
      this.state.set(parseMru(raw)),
    );
    this.sync.register('working-state', STORAGE_KEY, (raw) =>
      this.state.set(parseMru(raw)),
    );
  }

  record(id: string): void {
    const next = [id, ...this.state().filter((known) => known !== id)].slice(
      0,
      LIMIT,
    );
    this.state.set(next);
    void this.store.set(STORAGE_KEY, JSON.stringify(next));
  }
}

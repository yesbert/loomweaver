import { inject, Service, signal } from '@angular/core';
import { WORKING_STATE_STORE } from '../../persistence/working-state-store';
import { hydrateAsync } from '../../persistence/hydrate';
import { ActiveWorkspaceService } from '../../workspace/active-workspace.service';

const STORAGE_KEY = 'lw.shell.hidden-views';

export function parseHiddenViews(raw: string | undefined): ReadonlySet<string> {
  if (!raw) {
    return new Set();
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return new Set();
    }
    return new Set(parsed.filter((id): id is string => typeof id === 'string'));
  } catch {
    return new Set();
  }
}

@Service()
export class HiddenViewsService {
  private readonly store = inject(WORKING_STATE_STORE);
  private readonly workspace = inject(ActiveWorkspaceService);
  private readonly ids = signal<ReadonlySet<string>>(
    parseHiddenViews(this.store.peek?.(this.workspace.scopedKey(STORAGE_KEY))),
  );
  readonly hidden = this.ids.asReadonly();

  constructor() {
    this.hydrateWhenWorkspaceReady();
  }

  isHidden(viewId: string): boolean {
    return this.ids().has(viewId);
  }

  hide(viewId: string): void {
    if (this.ids().has(viewId)) {
      return;
    }
    this.commit(new Set([...this.ids(), viewId]));
  }

  show(viewId: string): void {
    if (!this.ids().has(viewId)) {
      return;
    }
    const next = new Set(this.ids());
    next.delete(viewId);
    this.commit(next);
  }

  hydrate(raw: string | undefined): void {
    this.ids.set(parseHiddenViews(raw));
    void this.store.set(this.storageKey(), this.serialize());
  }

  serialize(): string {
    return JSON.stringify([...this.ids()].sort((a, b) => a.localeCompare(b)));
  }

  private commit(next: ReadonlySet<string>): void {
    this.ids.set(next);
    void this.store.set(this.storageKey(), this.serialize());
  }

  private storageKey(): string {
    return this.workspace.scopedKey(STORAGE_KEY);
  }

  private hydrateWhenWorkspaceReady(): void {
    void this.workspace.ready.then(() =>
      hydrateAsync(this.store, this.storageKey(), (raw) =>
        this.ids.set(parseHiddenViews(raw)),
      ),
    );
  }
}

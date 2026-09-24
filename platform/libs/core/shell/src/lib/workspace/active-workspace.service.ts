import { inject, Service, signal } from '@angular/core';
import { readStoredValue } from '../persistence/stored-values/hydrate';
import { WORKING_STATE_STORE } from '../persistence/working-state-store';
import { WORKSPACE_DEFINITIONS } from './provide-workspaces';
import {
  DEFAULT_WORKSPACE_ID,
  defaultWorkspaceId,
} from './workspace-definition';

const ACTIVE_KEY = 'lw.shell.active-workspace';

export { DEFAULT_WORKSPACE_ID } from './workspace-definition';

export function workspaceScopedKey(base: string, workspaceId: string): string {
  return `${base}:${workspaceId}`;
}

function storedId(raw: string | undefined): string | null {
  return raw?.trim() ? raw : null;
}

@Service()
export class ActiveWorkspaceService {
  private readonly store = inject(WORKING_STATE_STORE);
  private readonly defaultId = defaultWorkspaceId(
    (inject(WORKSPACE_DEFINITIONS, { optional: true }) ?? []).flat(),
  );
  private readonly declaredInitial =
    this.defaultId === DEFAULT_WORKSPACE_ID ? null : this.defaultId;
  private readonly active = signal(
    this.fromStore(this.store.peek?.(ACTIVE_KEY)) ?? this.defaultId,
  );
  readonly id = this.active.asReadonly();

  private adopted = false;
  private chosen = false;
  readonly ready: Promise<string> = this.resolveInitial();

  set(id: string): void {
    this.adopted = false;
    this.chosen = true;
    this.active.set(id);
    void this.store.set(ACTIVE_KEY, id);
  }

  wasChosen(): boolean {
    return this.chosen;
  }

  async reread(): Promise<void> {
    const id = this.fromStore(await readStoredValue(this.store, ACTIVE_KEY));
    if (id !== null) {
      this.active.set(id);
    }
  }

  takeAdoption(): string | null {
    if (!this.adopted) {
      return null;
    }
    this.adopted = false;
    return this.active();
  }

  scopedKey(base: string): string {
    return workspaceScopedKey(base, this.active());
  }

  private resolveInitial(): Promise<string> {
    if (this.store.peek) {
      const raw = this.store.peek(ACTIVE_KEY);
      this.adoptIfUnseen(storedId(raw));
      this.rewriteSuperseded(raw);
      return Promise.resolve(this.active());
    }
    return this.store
      .get(ACTIVE_KEY)
      .then((raw) => {
        const id = this.fromStore(raw);
        if (id) {
          this.active.set(id);
          this.rewriteSuperseded(raw);
        } else {
          this.adoptIfUnseen(null);
        }
        return this.active();
      })
      .catch(() => this.active());
  }

  private fromStore(raw: string | undefined): string | null {
    const id = storedId(raw);
    return id === DEFAULT_WORKSPACE_ID ? this.defaultId : id;
  }

  private rewriteSuperseded(raw: string | undefined): void {
    if (
      storedId(raw) === DEFAULT_WORKSPACE_ID &&
      this.declaredInitial !== null
    ) {
      void this.store.set(ACTIVE_KEY, this.declaredInitial);
    }
  }

  private adoptIfUnseen(stored: string | null): void {
    if (stored !== null || this.declaredInitial === null) {
      return;
    }
    this.adopted = true;
    this.active.set(this.declaredInitial);
    void this.store.set(ACTIVE_KEY, this.declaredInitial);
  }
}

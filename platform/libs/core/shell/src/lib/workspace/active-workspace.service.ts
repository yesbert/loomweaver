import { inject, Service, signal } from '@angular/core';
import { WORKING_STATE_STORE } from '../persistence/working-state-store';
import { WORKSPACE_DEFINITIONS } from './provide-workspaces';
import { DEFAULT_WORKSPACE_ID } from './workspace-definition';

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
  private readonly declaredInitial =
    (inject(WORKSPACE_DEFINITIONS, { optional: true }) ?? [])
      .flat()
      .find((definition) => definition.initial)?.id ?? null;
  private readonly active = signal(
    storedId(this.store.peek?.(ACTIVE_KEY)) ??
      (this.store.peek ? this.declaredInitial : null) ??
      DEFAULT_WORKSPACE_ID,
  );
  readonly id = this.active.asReadonly();

  private adopted = false;
  readonly ready: Promise<string> = this.resolveInitial();

  set(id: string): void {
    this.adopted = false;
    this.active.set(id);
    void this.store.set(ACTIVE_KEY, id);
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
      this.adoptIfUnseen(storedId(this.store.peek(ACTIVE_KEY)));
      return Promise.resolve(this.active());
    }
    return this.store
      .get(ACTIVE_KEY)
      .then((raw) => {
        const id = storedId(raw);
        if (id) {
          this.active.set(id);
        } else {
          this.adoptIfUnseen(null);
        }
        return this.active();
      })
      .catch(() => this.active());
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

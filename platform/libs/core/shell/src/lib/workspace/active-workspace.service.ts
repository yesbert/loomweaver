import { inject, Service, signal } from '@angular/core';
import { readStoredValue } from '../persistence/stored-values/hydrate';
import { WORKING_STATE_STORE } from '../persistence/working-state-store';
import { WORKSPACE_DEFINITIONS } from './provide-workspaces';
import {
  BUILT_IN_WORKSPACE_ID,
  startingWorkspaceId,
} from './workspace-definition';

const ACTIVE_KEY = 'lw.shell.active-workspace';

export function workspaceScopedKey(base: string, workspaceId: string): string {
  return `${base}:${workspaceId}`;
}

function storedId(raw: string | undefined): string | null {
  return raw?.trim() ? raw : null;
}

@Service()
export class ActiveWorkspaceService {
  private readonly workingStateStore = inject(WORKING_STATE_STORE);
  private readonly startingId = startingWorkspaceId(
    (inject(WORKSPACE_DEFINITIONS, { optional: true }) ?? []).flat(),
  );
  private readonly declaredInitial =
    this.startingId === BUILT_IN_WORKSPACE_ID ? null : this.startingId;
  private readonly active = signal(
    this.fromStore(this.workingStateStore.peek?.(ACTIVE_KEY)) ??
      this.startingId,
  );
  readonly id = this.active.asReadonly();

  private adopted = false;
  private chosen = false;
  readonly ready: Promise<string>;

  constructor() {
    this.ready = this.resolveInitial();
  }

  set(id: string): void {
    this.adopted = false;
    this.chosen = true;
    this.active.set(id);
    void this.workingStateStore.set(ACTIVE_KEY, id);
  }

  wasChosen(): boolean {
    return this.chosen;
  }

  async reread(): Promise<void> {
    const id = this.fromStore(
      await readStoredValue(this.workingStateStore, ACTIVE_KEY),
    );
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
    if (this.workingStateStore.peek) {
      const raw = this.workingStateStore.peek(ACTIVE_KEY);
      this.adoptIfUnseen(storedId(raw));
      this.rewriteSuperseded(raw);
      return Promise.resolve(this.active());
    }
    return this.workingStateStore
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
    return id === BUILT_IN_WORKSPACE_ID ? this.startingId : id;
  }

  private rewriteSuperseded(raw: string | undefined): void {
    if (
      storedId(raw) === BUILT_IN_WORKSPACE_ID &&
      this.declaredInitial !== null
    ) {
      void this.workingStateStore.set(ACTIVE_KEY, this.declaredInitial);
    }
  }

  private adoptIfUnseen(stored: string | null): void {
    if (stored !== null || this.declaredInitial === null) {
      return;
    }
    this.adopted = true;
    this.active.set(this.declaredInitial);
    void this.workingStateStore.set(ACTIVE_KEY, this.declaredInitial);
  }
}

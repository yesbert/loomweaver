import { inject, Service, signal } from '@angular/core';
import { WORKING_STATE_STORE } from '../../persistence/working-state-store';
import { hydrateAsync } from '../../persistence/hydrate';
import { RetainedViewStash } from '../pane/retention/retained-view-stash';

const STORAGE_KEY = 'lw.shell.panels';

function parseCollapsed(raw: string | undefined): Record<string, boolean> {
  if (!raw) {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    const result: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (value === true) {
        result[key] = value;
      }
    }
    return result;
  } catch {
    return {};
  }
}

@Service()
export class PanelState {
  private readonly store = inject(WORKING_STATE_STORE);
  private readonly stash = inject(RetainedViewStash);
  private readonly collapsed = signal<Record<string, boolean>>(
    parseCollapsed(this.store.peek?.(STORAGE_KEY)),
  );

  private readonly overlay = signal<string | null>(null);

  constructor() {
    hydrateAsync(this.store, STORAGE_KEY, (raw) =>
      this.collapsed.set(parseCollapsed(raw)),
    );
  }

  isCollapsed(regionId: string): boolean {
    return this.collapsed()[regionId] ?? false;
  }

  isOverlayOpen(regionId: string): boolean {
    return this.overlay() === regionId;
  }

  anyOverlayOpen(): boolean {
    return this.overlay() !== null;
  }

  openOverlay(regionId: string): void {
    this.overlay.set(regionId);
  }

  closeOverlay(): void {
    this.overlay.set(null);
  }

  toggle(regionId: string): void {
    this.setCollapsed(regionId, !this.isCollapsed(regionId));
  }

  expand(regionId: string): void {
    this.setCollapsed(regionId, false);
  }

  reset(): void {
    this.overlay.set(null);
    this.collapsed.set({});
    void this.store.delete(STORAGE_KEY);
  }

  private setCollapsed(regionId: string, value: boolean): void {
    if (value) {
      this.stash.evacuate(`${regionId}:`);
    }
    const next = { ...this.collapsed() };
    if (value) {
      next[regionId] = true;
    } else {
      delete next[regionId];
    }
    this.collapsed.set(next);
    void this.store.set(STORAGE_KEY, JSON.stringify(next));
  }
}

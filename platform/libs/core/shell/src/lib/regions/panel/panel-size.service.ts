import { inject, Service, signal } from '@angular/core';
import { WORKING_STATE_STORE } from '../../persistence/working-state-store';
import { hydrateAsync } from '../../persistence/hydrate';

const STORAGE_KEY = 'lw.shell.panel-sizes';

export const DEFAULT_PANEL_WIDTH = 256;

export const MIN_PANEL_WIDTH = 180;
export const MAX_PANEL_WIDTH = 480;

function clampWidth(px: number): number {
  return Math.round(Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, px)));
}

function parseWidths(raw: string | undefined): Record<string, number> {
  if (!raw) {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    const result: Record<string, number> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (!(typeof value === 'number' && Number.isFinite(value))) {
        continue;
      }

      const clamped = clampWidth(value);
      if (clamped !== DEFAULT_PANEL_WIDTH) {
        result[key] = clamped;
      }
    }
    return result;
  } catch {
    return {};
  }
}

@Service()
export class PanelSizeService {
  private readonly store = inject(WORKING_STATE_STORE);

  readonly minWidth = MIN_PANEL_WIDTH;
  readonly maxWidth = MAX_PANEL_WIDTH;

  private readonly widths = signal<Record<string, number>>(
    parseWidths(this.store.peek?.(STORAGE_KEY)),
  );
  private readonly dragging = signal(false);

  constructor() {
    hydrateAsync(this.store, STORAGE_KEY, (raw) =>
      this.widths.set(parseWidths(raw)),
    );
  }

  width(regionId: string): number {
    return this.widths()[regionId] ?? DEFAULT_PANEL_WIDTH;
  }

  isResizing(): boolean {
    return this.dragging();
  }

  beginResize(): void {
    this.dragging.set(true);
  }

  endResize(): void {
    this.dragging.set(false);
    this.persist();
  }

  setWidth(regionId: string, px: number): void {
    const clamped = clampWidth(px);
    this.widths.update((state) => {
      const next = { ...state };
      if (clamped === DEFAULT_PANEL_WIDTH) {
        delete next[regionId];
      } else {
        next[regionId] = clamped;
      }
      return next;
    });
  }

  commit(): void {
    this.persist();
  }

  reset(): void {
    this.widths.set({});
    void this.store.delete(STORAGE_KEY);
  }

  private persist(): void {
    void this.store.set(STORAGE_KEY, JSON.stringify(this.widths()));
  }
}

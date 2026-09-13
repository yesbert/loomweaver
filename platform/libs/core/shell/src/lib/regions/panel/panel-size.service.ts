import { inject, Service, signal } from '@angular/core';
import { WORKING_STATE_STORE } from '../../persistence/working-state-store';
import { hydrateAsync, readStoredValue } from '../../persistence/hydrate';
import { StateSyncService } from '../../persistence/state-sync.service';
import { PanelRegion, SHELL_LAYOUT, ShellLayout } from '../../layout/layout';
import {
  clampToPanelWidths,
  PanelWidths,
  resolvePanelWidths,
  WORKBENCH_PANEL_WIDTHS,
} from '../../layout/panel-widths';

export {
  DEFAULT_PANEL_WIDTH,
  MAX_PANEL_WIDTH,
  MIN_PANEL_WIDTH,
} from '../../layout/panel-widths';

const STORAGE_KEY = 'lw.shell.panel-sizes';

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
      if (typeof value === 'number' && Number.isFinite(value)) {
        result[key] = value;
      }
    }
    return result;
  } catch {
    return {};
  }
}

function panelWidthsByRegion(
  layout: ShellLayout,
): ReadonlyMap<string, PanelWidths> {
  return new Map(
    layout.regions
      .filter((region): region is PanelRegion => region.type === 'panel')
      .map((region) => [region.id, resolvePanelWidths(region)]),
  );
}

@Service()
export class PanelSizeService {
  private readonly store = inject(WORKING_STATE_STORE);
  private readonly sync = inject(StateSyncService);
  private readonly declared = panelWidthsByRegion(inject(SHELL_LAYOUT));

  private readonly widths = signal<Record<string, number>>(
    parseWidths(this.store.peek?.(STORAGE_KEY)),
  );
  private readonly dragging = signal(false);

  constructor() {
    const apply = (raw: string | undefined) =>
      this.widths.set(parseWidths(raw));
    hydrateAsync(this.store, STORAGE_KEY, apply);
    this.sync.onNamespaceAdopted(async () =>
      apply(await readStoredValue(this.store, STORAGE_KEY)),
    );
  }

  width(regionId: string): number {
    const widths = this.widthsOf(regionId);
    const stored = this.widths()[regionId];
    return stored === undefined
      ? widths.start
      : clampToPanelWidths(stored, widths);
  }

  minWidth(regionId: string): number {
    return this.widthsOf(regionId).min;
  }

  maxWidth(regionId: string): number {
    return this.widthsOf(regionId).max;
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
    const clamped = clampToPanelWidths(px, this.widthsOf(regionId));
    this.widths.update((state) => ({ ...state, [regionId]: clamped }));
  }

  commit(): void {
    this.persist();
  }

  reset(): void {
    this.widths.set({});
    void this.store.delete(STORAGE_KEY);
  }

  private widthsOf(regionId: string): PanelWidths {
    return this.declared.get(regionId) ?? WORKBENCH_PANEL_WIDTHS;
  }

  private persist(): void {
    void this.store.set(STORAGE_KEY, JSON.stringify(this.widths()));
  }
}

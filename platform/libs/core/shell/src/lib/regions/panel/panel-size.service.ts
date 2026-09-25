import { inject, Service, signal } from '@angular/core';
import { WORKING_STATE_STORE } from '../../persistence/working-state-store';
import {
  hydrateAsync,
  readStoredValue,
} from '../../persistence/stored-values/hydrate';
import { StateSyncService } from '../../persistence/cross-tab/state-sync.service';
import { parseRecord } from '../../persistence/stored-values/persisted-record';
import { SHELL_LAYOUT, ShellLayout } from '../../layout/layout';
import { panelRegions } from '../../layout/layout-queries';
import {
  clampToPanelWidths,
  PanelWidths,
  resolvePanelWidths,
  WORKBENCH_PANEL_WIDTHS,
} from '../../layout/panel-widths';

const STORAGE_KEY = 'lw.shell.panel-sizes';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function parseWidths(
  raw: string | undefined,
): Readonly<Record<string, number>> {
  return parseRecord(raw, isFiniteNumber);
}

function panelWidthsByRegion(
  layout: ShellLayout,
): ReadonlyMap<string, PanelWidths> {
  return new Map(
    panelRegions(layout).map((region) => [
      region.id,
      resolvePanelWidths(region),
    ]),
  );
}

@Service()
export class PanelSizeService {
  private readonly store = inject(WORKING_STATE_STORE);
  private readonly sync = inject(StateSyncService);
  private readonly declared = panelWidthsByRegion(inject(SHELL_LAYOUT));

  private readonly widths = signal<Readonly<Record<string, number>>>(
    parseWidths(this.store.peek?.(STORAGE_KEY)),
  );
  private readonly resizing = signal(false);

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
    return this.resizing();
  }

  beginResize(): void {
    this.resizing.set(true);
  }

  endResize(): void {
    this.resizing.set(false);
    this.commit();
  }

  setWidth(regionId: string, px: number): void {
    const clamped = clampToPanelWidths(px, this.widthsOf(regionId));
    this.widths.update((state) => ({ ...state, [regionId]: clamped }));
  }

  commit(): void {
    void this.store.set(STORAGE_KEY, JSON.stringify(this.widths()));
  }

  reset(): void {
    this.widths.set({});
    void this.store.delete(STORAGE_KEY);
  }

  private widthsOf(regionId: string): PanelWidths {
    return this.declared.get(regionId) ?? WORKBENCH_PANEL_WIDTHS;
  }
}

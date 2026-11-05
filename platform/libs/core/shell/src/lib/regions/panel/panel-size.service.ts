import { inject, Service, signal } from '@angular/core';
import { persistedWorkingState } from '../../persistence/stored-values/persisted-setting';
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
  private readonly declared = panelWidthsByRegion(inject(SHELL_LAYOUT));
  private readonly stored = persistedWorkingState(STORAGE_KEY, {
    parse: parseWidths,
    serialize: (widths) => JSON.stringify(widths),
  });

  private readonly uncommitted = signal<Readonly<Record<string, number>>>({});
  private readonly resizing = signal(false);

  width(regionId: string): number {
    const widths = this.widthsOf(regionId);
    const set = this.uncommitted()[regionId] ?? this.stored.value()[regionId];
    return set === undefined ? widths.start : clampToPanelWidths(set, widths);
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
    if (!Number.isFinite(px)) {
      return;
    }
    const clamped = clampToPanelWidths(px, this.widthsOf(regionId));
    this.uncommitted.update((state) => ({ ...state, [regionId]: clamped }));
  }

  commit(): void {
    const set = this.uncommitted();
    this.uncommitted.set({});
    this.stored.update((state) => ({ ...state, ...set }));
  }

  reset(): void {
    this.uncommitted.set({});
    this.stored.clear();
  }

  private widthsOf(regionId: string): PanelWidths {
    return this.declared.get(regionId) ?? WORKBENCH_PANEL_WIDTHS;
  }
}

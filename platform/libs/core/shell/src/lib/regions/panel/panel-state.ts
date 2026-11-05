import { inject, Service, signal } from '@angular/core';
import { persistedWorkingState } from '../../persistence/stored-values/persisted-setting';
import {
  FlagRecord,
  isTrue,
  parseRecord,
  toggledFlag,
} from '../../persistence/stored-values/persisted-record';
import { RetainedViewStash } from '../pane/retention/retained-view-stash';
import { isKeyOfDock } from '../pane/retention/retention-keys';

const STORAGE_KEY = 'lw.shell.panels';

function parseCollapsed(raw: string | undefined): FlagRecord {
  return parseRecord(raw, isTrue);
}

@Service()
export class PanelState {
  private readonly stash = inject(RetainedViewStash);
  private readonly stored = persistedWorkingState(STORAGE_KEY, {
    parse: parseCollapsed,
    serialize: (state) => JSON.stringify(state),
  });
  private readonly collapsed = this.stored.value;

  private readonly overlay = signal<string | null>(null);

  isCollapsed(regionId: string): boolean {
    return this.collapsed()[regionId] === true;
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
    this.stored.clear();
  }

  private setCollapsed(regionId: string, value: boolean): void {
    if (value) {
      this.stash.evacuate((key) => isKeyOfDock(key, regionId));
    }
    this.stored.update((state) => toggledFlag(state, regionId, value));
  }
}

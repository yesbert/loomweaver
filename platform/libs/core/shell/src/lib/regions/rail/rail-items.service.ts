import { inject, Service, signal } from '@angular/core';
import { SETTINGS_STORE } from '../../persistence/settings-store';
import { hydrateAsync } from '../../persistence/hydrate';
import { StateSyncService } from '../../persistence/state-sync.service';

const STORAGE_KEY = 'lw.shell.rail-items';

const WORKSPACE_RAIL_PREFIX = 'shell.workspace:';

interface RailItemsState {
  readonly hidden: readonly string[];
  readonly placed: Readonly<Record<string, string>>;
}

const EMPTY: RailItemsState = { hidden: [], placed: {} };

export function workspaceRailItemId(workspaceId: string): string {
  return `${WORKSPACE_RAIL_PREFIX}${workspaceId}`;
}

export function isWorkspaceRailItem(itemId: string): boolean {
  return itemId.startsWith(WORKSPACE_RAIL_PREFIX);
}

function parse(raw: string | undefined): RailItemsState {
  if (!raw) {
    return EMPTY;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return EMPTY;
    }
    const state = parsed as Record<string, unknown>;
    const hidden = Array.isArray(state['hidden'])
      ? state['hidden'].filter((id): id is string => typeof id === 'string')
      : [];
    const placed: Record<string, string> = {};
    const rawPlaced = state['placed'];
    if (
      rawPlaced &&
      typeof rawPlaced === 'object' &&
      !Array.isArray(rawPlaced)
    ) {
      for (const [id, region] of Object.entries(rawPlaced)) {
        if (typeof region === 'string') {
          placed[id] = region;
        }
      }
    }
    return { hidden, placed };
  } catch {
    return EMPTY;
  }
}

@Service()
export class RailItemsService {
  private readonly store = inject(SETTINGS_STORE);
  private readonly sync = inject(StateSyncService);
  private readonly state = signal<RailItemsState>(
    parse(this.store.peek?.(STORAGE_KEY)),
  );

  constructor() {
    hydrateAsync(this.store, STORAGE_KEY, (raw) => this.state.set(parse(raw)));
    this.sync.register('settings', STORAGE_KEY, (raw) =>
      this.state.set(parse(raw)),
    );
  }

  regionOf(itemId: string, declaredRail: string): string {
    return this.state().placed[itemId] ?? declaredRail;
  }

  isVisible(itemId: string): boolean {
    if (isWorkspaceRailItem(itemId)) {
      return itemId in this.state().placed;
    }
    return !this.state().hidden.includes(itemId);
  }

  show(itemId: string, regionId: string): void {
    const state = this.state();
    this.commit({
      hidden: state.hidden.filter((id) => id !== itemId),
      placed: { ...state.placed, [itemId]: regionId },
    });
  }

  hide(itemId: string): void {
    if (!this.isVisible(itemId)) {
      return;
    }
    const state = this.state();
    const placed = { ...state.placed };
    delete placed[itemId];
    this.commit({
      hidden: isWorkspaceRailItem(itemId)
        ? state.hidden
        : [...state.hidden, itemId],
      placed,
    });
  }

  toggle(itemId: string, regionId: string): void {
    if (this.isVisible(itemId)) {
      this.hide(itemId);
    } else {
      this.show(itemId, regionId);
    }
  }

  reset(): void {
    this.state.set(parse(undefined));
    void this.store.delete(STORAGE_KEY);
  }

  private commit(next: RailItemsState): void {
    this.state.set(next);
    void this.store.set(STORAGE_KEY, JSON.stringify(next));
  }
}

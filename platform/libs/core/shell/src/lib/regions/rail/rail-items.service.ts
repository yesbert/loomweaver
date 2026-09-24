import { Service } from '@angular/core';
import { persistedSetting } from '../../persistence/stored-values/persisted-setting';
import { recordOf } from '../../persistence/stored-values/persisted-record';

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

function isString(value: unknown): value is string {
  return typeof value === 'string';
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
    return {
      hidden: Array.isArray(state['hidden'])
        ? state['hidden'].filter(isString)
        : [],
      placed: recordOf(state['placed'], isString),
    };
  } catch {
    return EMPTY;
  }
}

@Service()
export class RailItemsService {
  private readonly stored = persistedSetting(STORAGE_KEY, {
    parse,
    serialize: (state) => JSON.stringify(state),
  });

  private readonly state = this.stored.value;

  regionOf(itemId: string, declaredRail: string): string {
    return this.state().placed[itemId] ?? declaredRail;
  }

  isVisible(itemId: string): boolean {
    if (isWorkspaceRailItem(itemId)) {
      return Object.hasOwn(this.state().placed, itemId);
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
    this.stored.clear();
  }

  private commit(next: RailItemsState): void {
    this.stored.set(next);
  }
}

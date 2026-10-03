import { Service, Signal, signal, untracked } from '@angular/core';
import { Disposable, Toolbar, ToolbarCell } from '@loomweaver/plugin-sdk';
import { upsertBy, upsertById } from '../foundation/identified';

export interface RegisteredToolbar {
  readonly toolbar: Toolbar;
  readonly ownerId?: string;
}

const ACTIONS_SLOT_SUFFIX = '/actions';

export function surfaceActionsSlot(surfaceId: string): string {
  return `${surfaceId}${ACTIONS_SLOT_SUFFIX}`;
}

export function surfaceOfActionsSlot(slot: string): string | undefined {
  return slot.endsWith(ACTIONS_SLOT_SUFFIX) && slot.length > ACTIONS_SLOT_SUFFIX.length
    ? slot.slice(0, -ACTIONS_SLOT_SUFFIX.length)
    : undefined;
}

@Service()
export class ToolbarRegistry {
  private readonly toolbarsSignal = signal<readonly RegisteredToolbar[]>([]);

  private readonly cellsSignal = signal<readonly ToolbarCell[]>([]);

  readonly toolbars: Signal<readonly RegisteredToolbar[]> =
    this.toolbarsSignal.asReadonly();

  readonly cells: Signal<readonly ToolbarCell[]> = this.cellsSignal.asReadonly();

  addToolbar(toolbar: Toolbar, pluginId?: string): Disposable {
    const taken = untracked(() =>
      this.toolbarsSignal().find(
        (entry) =>
          entry.toolbar.slot === toolbar.slot && entry.ownerId !== pluginId,
      ),
    );
    if (taken) {
      console.warn(
        `Toolbar slot '${toolbar.slot}' is already registered by ${ownerName(taken.ownerId)}; ` +
          `the registration from ${ownerName(pluginId)} is refused.`,
      );
      return { dispose: () => undefined };
    }
    const entry: RegisteredToolbar = { toolbar, ownerId: pluginId };
    this.toolbarsSignal.update((entries) =>
      upsertBy(entries, entry, (existing) => existing.toolbar.slot === toolbar.slot),
    );
    return {
      dispose: () =>
        this.toolbarsSignal.update((entries) =>
          entries.filter((existing) => existing !== entry),
        ),
    };
  }

  addCell(cell: ToolbarCell): Disposable {
    this.cellsSignal.update((cells) => upsertById(cells, cell));
    return {
      dispose: () =>
        this.cellsSignal.update((cells) =>
          cells.filter((existing) => existing !== cell),
        ),
    };
  }

  titleOf(slot: string): string | undefined {
    return this.toolbars().find((entry) => entry.toolbar.slot === slot)?.toolbar
      .title;
  }
}

function ownerName(pluginId: string | undefined): string {
  return pluginId === undefined ? 'the workbench' : `plugin "${pluginId}"`;
}

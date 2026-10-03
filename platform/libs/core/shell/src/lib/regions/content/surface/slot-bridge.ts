import { effect, Injector } from '@angular/core';
import { MenuContext } from '@loomweaver/plugin-sdk';
import { ResolvedEntry } from '../../../menu/menu-resolution';
import type { LwSlotView } from '../../../surface-kit/surface-kit.frame';
import { ToolbarEntry } from '../../toolbar/toolbar-entries';
import {
  ToolbarSlots,
  ToolbarSlotView,
} from '../../toolbar/toolbar-slots.service';

export type SlotPush = (subscription: string, view: LwSlotView) => void;

interface WatchedSlot {
  readonly slot: string;
  readonly context: MenuContext;
  readonly stop: () => void;
  resolved: readonly ResolvedEntry<ToolbarEntry>[];
  last?: LwSlotView;
}

export function frameSlotView(view: ToolbarSlotView): LwSlotView {
  return {
    label: view.label,
    moreLabel: view.moreLabel,
    entries: view.entries.map((entry, index) => ({
      key: entry.key,
      label: entry.label,
      group: entry.group,
      order: entry.order,
      icon: entry.icon,
      shortcut: entry.shortcut,
      pressed: entry.pressed,
      disabled: entry.disabled,
      opensMenu: entry.opensMenu,
      submenu: view.resolved[index]?.opensMenu,
    })),
  };
}

export class SlotBridge {
  private readonly watched = new Map<string, WatchedSlot>();

  private counter = 0;

  constructor(
    private readonly slots: ToolbarSlots,
    private readonly injector: Injector,
    private readonly push: SlotPush,
  ) {}

  watch(slot: string, context: MenuContext): string {
    this.counter += 1;
    const id = `slot-${this.counter}`;
    const entry: WatchedSlot = {
      slot,
      context,
      resolved: [],
      stop: () => ref.destroy(),
    };
    this.watched.set(id, entry);
    const ref = effect(
      () => {
        const view = this.slots.view(slot, context);
        entry.resolved = view.resolved;
        const framed = frameSlotView(view);
        entry.last = framed;
        queueMicrotask(() => {
          if (this.watched.get(id) === entry) {
            this.push(id, framed);
          }
        });
      },
      { injector: this.injector },
    );
    return id;
  }

  unwatch(id: string): void {
    this.watched.get(id)?.stop();
    this.watched.delete(id);
  }

  activate(id: string, key: string): void {
    const entry = this.watched.get(id);
    const resolved = entry?.resolved.find((candidate) => candidate.item.id === key);
    if (entry && resolved) {
      this.slots.run(resolved, entry.context);
    }
  }

  replay(): void {
    for (const [id, entry] of this.watched) {
      if (entry.last) {
        this.push(id, entry.last);
      }
    }
  }

  stopAll(): void {
    for (const entry of this.watched.values()) {
      entry.stop();
    }
    this.watched.clear();
  }
}

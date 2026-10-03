import { inject, Service } from '@angular/core';
import { MenuContext } from '@loomweaver/plugin-sdk';
import { CommandService } from '../../commands/command.service';
import { ContributionRegistry } from '../../contributions/contribution-registry';
import {
  surfaceOfActionsSlot,
  ToolbarRegistry,
} from '../../contributions/toolbar-registry';
import { LwToolbarEntry } from '../../elements/toolbar/lw-toolbar.element';
import { Wording } from '../../i18n/wording';
import { menuOnContext } from '../../menu/chrome-item-menu';
import { ResolvedEntry } from '../../menu/menu-resolution';
import { SlotResolution } from '../../menu/slot-resolution.service';
import {
  entryOfAction,
  entryOfMenuItem,
  ToolbarEntry,
} from './toolbar-entries';

const MORE_KEY = 'bar.more';

export interface ToolbarSlotView {
  readonly resolved: readonly ResolvedEntry<ToolbarEntry>[];
  readonly entries: readonly LwToolbarEntry[];
  readonly label: string;
  readonly moreLabel: string;
}

@Service()
export class ToolbarSlots {
  private readonly registry = inject(ContributionRegistry);

  private readonly toolbars = inject(ToolbarRegistry);

  private readonly slots = inject(SlotResolution);

  private readonly commands = inject(CommandService);

  private readonly wording = inject(Wording);

  view(slot: string, context: MenuContext, label?: string | null): ToolbarSlotView {
    const resolved = this.slots.resolve(this.entriesOf(slot), (entry) =>
      this.contextFor(entry, context),
    );
    return {
      resolved,
      entries: resolved.map((entry) => this.drawn(entry)),
      label: this.wording.translate(label || (this.toolbars.titleOf(slot) ?? '')),
      moreLabel: this.wording.translate(MORE_KEY),
    };
  }

  contextFor(entry: ToolbarEntry, context: MenuContext): MenuContext {
    return { ...context, id: entry.id };
  }

  run(entry: ResolvedEntry<ToolbarEntry>, context: MenuContext): void {
    if (!entry.disabled) {
      this.commands.trigger(entry.item, this.contextFor(entry.item, context));
    }
  }

  private entriesOf(slot: string): ToolbarEntry[] {
    const surfaceId = surfaceOfActionsSlot(slot);
    const actions =
      surfaceId === undefined
        ? []
        : this.registry.actionsOf(surfaceId).map((action) => entryOfAction(action));
    const items = this.registry
      .menuItems()
      .filter((item) => item.menu === slot)
      .map((item, index) => entryOfMenuItem(item, index));
    return [...actions, ...items];
  }

  private drawn(entry: ResolvedEntry<ToolbarEntry>): LwToolbarEntry {
    return {
      key: entry.item.id,
      label: this.wording.translate(entry.title ?? ''),
      group: entry.group,
      order: entry.order,
      icon: entry.icon,
      shortcut: entry.shortcut,
      pressed: entry.pressed,
      disabled: entry.disabled,
      opensMenu: entry.opensMenu !== undefined,
      hasContextMenu: menuOnContext(entry.item) !== undefined,
    };
  }
}

import { inject, Service } from '@angular/core';
import { LwButtonVariant, MenuContext } from '@loomweaver/plugin-sdk';
import { CommandService } from '../../commands/command.service';
import {
  ContributionRegistry,
  RegisteredContentRoute,
  RegisteredView,
} from '../../contributions/contribution-registry';
import {
  ownerName,
  SURFACE_OWNER,
  surfaceOfActionsSlot,
  ToolbarRegistry,
  withoutSurfaceOwner,
} from '../../contributions/toolbar-registry';
import { isButtonVariant } from '../../elements/button/lw-button-classes';
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

export const MORE_KEY = 'bar.more';

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

  private readonly reported = new Set<string>();

  view(slot: string, context: MenuContext, label?: string | null): ToolbarSlotView {
    const resolved = this.slots.resolve(this.entriesOf(slot, context), (entry) =>
      this.contextFor(entry, context),
    );
    return {
      resolved,
      entries: resolved.map((entry) => this.drawn(entry, slot, context)),
      label: this.wording.translate(label || (this.toolbars.titleOf(slot) ?? '')),
      moreLabel: this.wording.translate(MORE_KEY),
    };
  }

  contextFor(entry: ToolbarEntry, context: MenuContext): MenuContext {
    return { ...withoutSurfaceOwner(context), id: entry.id };
  }

  run(entry: ResolvedEntry<ToolbarEntry>, context: MenuContext): void {
    if (!entry.disabled) {
      this.commands.trigger(entry.item, this.contextFor(entry.item, context));
    }
  }

  private entriesOf(slot: string, context: MenuContext): ToolbarEntry[] {
    const actions = (this.surfaceOf(slot, context)?.actions ?? []).map((action) =>
      entryOfAction(action),
    );
    const items = this.registry
      .registeredMenuItems()
      .filter((entry) => entry.item.menu === slot)
      .map((entry, index) => entryOfMenuItem(entry.item, index, entry.ownerId));
    return [...actions, ...items];
  }

  private drawn(
    entry: ResolvedEntry<ToolbarEntry>,
    slot: string,
    context: MenuContext,
  ): LwToolbarEntry {
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
      variant: this.variantOf(entry.item, slot, context),
    };
  }

  private variantOf(
    entry: ToolbarEntry,
    slot: string,
    context: MenuContext,
  ): LwButtonVariant | undefined {
    const asked: unknown = entry.variant;
    if (asked === undefined) {
      return undefined;
    }
    if (!isButtonVariant(asked)) {
      this.reportOnce(
        `${slot}\u{0}${entry.id}\u{0}unknown`,
        `Toolbar entry '${entry.id}' in slot '${slot}' names ${describedVariant(asked)}, ` +
          'which no button has; it is drawn without a variant.',
      );
      return undefined;
    }
    if (asked !== 'primary') {
      return asked;
    }
    const owner = this.ownerOf(slot, context);
    if (owner !== undefined && entry.ownerId === owner) {
      return asked;
    }
    this.reportOnce(
      `${slot}\u{0}${entry.id}\u{0}primary`,
      `Toolbar entry '${entry.id}' from ${ownerName(entry.ownerId)} asks for 'primary' in slot ` +
        `'${slot}', which belongs to ${ownerName(owner)}; only the slot's owner draws a primary ` +
        'entry, so it is drawn without a variant.',
    );
    return undefined;
  }

  private ownerOf(slot: string, context: MenuContext): string | undefined {
    return surfaceOfActionsSlot(slot) === undefined
      ? this.toolbars.ownerOf(slot)
      : this.surfaceOf(slot, context)?.pluginId;
  }

  private surfaceOf(
    slot: string,
    context: MenuContext,
  ): RegisteredView | RegisteredContentRoute | undefined {
    const surfaceId = surfaceOfActionsSlot(slot);
    const held = surfaceId === undefined ? [] : this.registry.surfacesOf(surfaceId);
    const owner = context[SURFACE_OWNER];
    return (
      held.find((surface) => (surface.pluginId ?? '') === owner) ?? held[0]
    );
  }

  private reportOnce(key: string, message: string): void {
    if (this.reported.has(key)) {
      return;
    }
    this.reported.add(key);
    console.warn(message);
  }
}

function describedVariant(asked: unknown): string {
  if (typeof asked === 'string') {
    return `the variant '${asked}'`;
  }
  return `a variant of type ${asked === null ? 'null' : typeof asked}`;
}

import { inject, Service } from '@angular/core';
import { MenuContext } from '@loomweaver/plugin-sdk';
import { AuthContext } from '../auth/auth-context';
import { CommandService } from '../commands/command.service';
import { ContributionRegistry } from '../contributions/contribution-registry';
import { ChromeItemMenu, menuOnActivate } from './chrome-item-menu';
import {
  ResolvedEntry,
  resolveSlot,
  SlotEntry,
  slotSources,
} from './menu-resolution';
import { MenuService } from './menu.service';

@Service()
export class SlotResolution {
  private readonly registry = inject(ContributionRegistry);

  private readonly commands = inject(CommandService);

  private readonly auth = inject(AuthContext);

  private readonly menus = inject(MenuService);

  resolve<T extends SlotEntry>(
    entries: readonly T[],
    contextOf: (entry: T) => MenuContext,
  ): ResolvedEntry<T>[] {
    return resolveSlot(
      entries,
      contextOf,
      slotSources(
        { registry: this.registry, commands: this.commands, auth: this.auth },
        (entry, context) => this.menuOnActivation(entry, context),
      ),
    );
  }

  menuOnActivation(
    item: ChromeItemMenu,
    context: MenuContext,
  ): string | undefined {
    const menu = menuOnActivate(item);
    if (menu === undefined) {
      return undefined;
    }
    const heading = this.commands.triggerable(item)
      ? undefined
      : item.menuHeader;
    return this.menus.offers(menu, context, heading) ? menu : undefined;
  }
}

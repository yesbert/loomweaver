import { inject, Service } from '@angular/core';
import { MenuContext } from '@loomweaver/plugin-sdk';
import { CommandService } from '../commands/command.service';
import { ChromeItemMenu, menuOnActivate } from './chrome-item-menu';
import { MenuService } from './menu.service';

@Service()
export class ChromeItemOffers {
  private readonly commands = inject(CommandService);

  private readonly menus = inject(MenuService);

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

  offered(item: ChromeItemMenu, context: MenuContext): boolean {
    if (item.workspace !== undefined || 'component' in item) {
      return true;
    }
    return (
      this.menuOnActivation(item, context) !== undefined ||
      this.commands.triggerable(item)
    );
  }
}

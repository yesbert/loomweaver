import { Disposable, MenuContext } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../contributions/contribution-registry';
import { registerMenuCommand } from '../../menu/menu-command';
import { menuContextString } from '../../menu/menu-context';
import { RailItemsService } from './rail-items.service';
import { RailMoveService } from './rail-move.service';
import { menuEntryId } from '../../menu/menu-entry-id';
import { RAIL_CUSTOMIZE_COMMAND_ID } from '../../commands/host-command-ids';

const RAIL_HIDE_ITEM_COMMAND_ID = 'shell.rail.hideItem';
const RAIL_MOVE_TO_OTHER_RAIL_COMMAND_ID = 'shell.rail.moveToOtherRail';

export const RAIL_ITEM_CONTEXT_MENU = 'rail/item/context';

export const RAIL_CONTEXT_MENU = 'rail/context';

export function railMenuContext(id: string, region: string): MenuContext {
  return { targetKind: 'rail-item', id, region };
}

export function registerRailCustomizeMenu(
  registry: ContributionRegistry,
): Disposable {
  return registry.addMenuItem({
    id: menuEntryId(RAIL_CUSTOMIZE_COMMAND_ID),
    menu: RAIL_CONTEXT_MENU,
    command: RAIL_CUSTOMIZE_COMMAND_ID,
    group: '9_customize',
    order: 0,
  });
}

export function registerRailHideMenu(
  registry: ContributionRegistry,
  railItems: RailItemsService,
): Disposable {
  return registerMenuCommand(
    registry,
    RAIL_ITEM_CONTEXT_MENU,
    {
      id: RAIL_HIDE_ITEM_COMMAND_ID,
      title: 'rail.menu.hide',
      run: (context) => {
        const id = menuContextString(context, 'id');
        if (id) {
          railItems.hide(id);
        }
      },
    },
    {
      group: '5_visibility',
      order: 0,
    },
  );
}

export function registerRailMoveMenu(
  registry: ContributionRegistry,
  moves: RailMoveService,
): Disposable {
  return registerMenuCommand(
    registry,
    RAIL_ITEM_CONTEXT_MENU,
    {
      id: RAIL_MOVE_TO_OTHER_RAIL_COMMAND_ID,
      title: 'rail.menu.moveToOther',
      run: (context) => {
        const id = menuContextString(context, 'id');
        const target = moves.otherRail(menuContextString(context, 'region'));
        if (id && target) {
          moves.move(id, target);
        }
      },
    },
    {
      group: '1_move',
      order: 0,
    },
  );
}

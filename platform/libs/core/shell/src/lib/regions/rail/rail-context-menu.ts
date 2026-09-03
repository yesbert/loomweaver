import { Disposable } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { disposeTogether } from '../../plugin/dispose-together';
import { menuContextString } from '../../menu/menu-context';
import { RailItemsService } from './rail-items.service';
import { RailMoveService } from './rail-move.service';

export const RAIL_ITEM_CONTEXT_MENU = 'rail/item/context';

export const RAIL_CONTEXT_MENU = 'rail/context';

export function registerRailCustomizeMenu(
  registry: ContributionRegistry,
): Disposable {
  return disposeTogether([
    registry.addMenuItem({
      id: 'menu:shell.rail.customize',
      menu: RAIL_CONTEXT_MENU,
      command: 'shell.rail.customize',
      group: '9_customize',
      order: 0,
    }),
  ]);
}

export function registerRailContextMenu(
  registry: ContributionRegistry,
  railItems: RailItemsService,
): Disposable {
  return disposeTogether([
    registry.addCommand({
      id: 'shell.rail.hideItem',
      paletteHidden: true,
      title: 'rail.menu.hide',
      run: (context) => {
        const id = menuContextString(context, 'id');
        if (id) {
          railItems.hide(id);
        }
      },
    }),
    registry.addMenuItem({
      id: 'menu:shell.rail.hideItem',
      menu: RAIL_ITEM_CONTEXT_MENU,
      command: 'shell.rail.hideItem',
      group: '5_visibility',
      order: 0,
    }),
  ]);
}

export function registerRailMoveMenu(
  registry: ContributionRegistry,
  moves: RailMoveService,
): Disposable {
  return disposeTogether([
    registry.addCommand({
      id: 'shell.rail.moveToOtherRail',
      paletteHidden: true,
      title: 'rail.menu.moveToOther',
      run: (context) => {
        const id = menuContextString(context, 'id');
        const target = moves.otherRail(menuContextString(context, 'region'));
        if (id && target) {
          moves.move(id, target);
        }
      },
    }),
    registry.addMenuItem({
      id: 'menu:shell.rail.moveToOtherRail',
      menu: RAIL_ITEM_CONTEXT_MENU,
      command: 'shell.rail.moveToOtherRail',
      group: '1_move',
      order: 0,
    }),
  ]);
}

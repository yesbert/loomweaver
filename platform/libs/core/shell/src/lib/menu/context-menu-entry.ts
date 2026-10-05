import { Command, Disposable, MenuItem } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../contributions/contribution-registry';
import { disposeTogether } from '../contributions/dispose-together';
import { menuEntryId } from './menu-entry-id';

export type MenuPlacement = Pick<MenuItem, 'group' | 'order' | 'when' | 'checkedWhen'>;

export function registerMenuCommand(
  registry: ContributionRegistry,
  menu: string,
  command: Command,
  placement: MenuPlacement,
): Disposable {
  return disposeTogether([
    registry.addCommand({ ...command, paletteHidden: true }),
    registry.addMenuItem({
      id: menuEntryId(command.id),
      menu,
      command: command.id,
      ...placement,
    }),
  ]);
}

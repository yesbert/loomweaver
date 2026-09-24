import { Disposable } from '@loomweaver/plugin-sdk';
import { DialogService } from '../dialog/dialog.service';
import { ContributionRegistry } from '../plugin/contribution-registry';
import {
  CommandPalette,
  PALETTE_COMMAND_ID,
  QUICK_OPEN_COMMAND_ID,
} from './command-palette';

function openPalette(
  dialogs: DialogService,
  title: string,
  data?: { readonly mode: 'tabs' },
): void {
  dialogs.open(CommandPalette, {
    bare: true,
    size: 'lg',
    align: 'top',
    title,
    ...(data && { data }),
  });
}

export function registerPaletteCommand(
  registry: ContributionRegistry,
  dialogs: DialogService,
): Disposable {
  return registry.addCommand({
    id: PALETTE_COMMAND_ID,
    title: 'palette.title',
    icon: 'search',
    shortcut: 'mod+k',
    popout: true,
    run: () => openPalette(dialogs, 'palette.title'),
  });
}

export function registerQuickOpenCommand(
  registry: ContributionRegistry,
  dialogs: DialogService,
): Disposable {
  return registry.addCommand({
    id: QUICK_OPEN_COMMAND_ID,
    title: 'palette.quickOpenTitle',
    icon: 'openWork',
    shortcut: 'mod+p',
    run: () => openPalette(dialogs, 'palette.quickOpenTitle', { mode: 'tabs' }),
  });
}

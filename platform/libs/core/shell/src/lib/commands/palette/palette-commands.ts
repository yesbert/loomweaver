import { DialogRef, Disposable } from '@loomweaver/plugin-sdk';
import { DialogService } from '../../dialog/dialog.service';
import { ContributionRegistry } from '../../contributions/contribution-registry';
import {
  CommandPalette,
  PALETTE_COMMAND_ID,
  QUICK_OPEN_COMMAND_ID,
} from './command-palette';

interface OpenSearch {
  readonly ref: DialogRef;
  readonly title: string;
}

const openSearches = new WeakMap<DialogService, OpenSearch>();

function searchOpener(
  dialogs: DialogService,
  title: string,
  data?: { readonly mode: 'tabs' },
): () => void {
  return () => {
    const open = openSearches.get(dialogs);
    if (open?.title === title) {
      return;
    }
    const ref = dialogs.open(CommandPalette, {
      bare: true,
      size: 'lg',
      align: 'top',
      title,
      ...(data && { data }),
    });
    openSearches.set(dialogs, { ref, title });
    void ref.closed.then(() => {
      if (openSearches.get(dialogs)?.ref === ref) {
        openSearches.delete(dialogs);
      }
    });
    open?.ref.close();
  };
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
    run: searchOpener(dialogs, 'palette.title'),
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
    run: searchOpener(dialogs, 'palette.quickOpenTitle', { mode: 'tabs' }),
  });
}

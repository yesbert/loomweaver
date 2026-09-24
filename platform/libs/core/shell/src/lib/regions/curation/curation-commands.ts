import { Disposable } from '@loomweaver/plugin-sdk';
import {
  RAIL_CUSTOMIZE_COMMAND_ID,
  VIEWS_CUSTOMIZE_COMMAND_ID,
} from '../../commands/host-command-ids';
import { DialogService } from '../../dialog/dialog.service';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import {
  CURATION_CHROME,
  CurationDialog,
  CurationKind,
} from './curation-dialog';

function openCuration(dialogs: DialogService, kind: CurationKind): void {
  dialogs.open(CurationDialog, {
    bare: true,
    size: 'lg',
    align: 'top',
    title: CURATION_CHROME[kind].title,
    data: { kind },
  });
}

export function registerRailCurationCommand(
  registry: ContributionRegistry,
  dialogs: DialogService,
): Disposable {
  return registry.addCommand({
    id: RAIL_CUSTOMIZE_COMMAND_ID,
    title: CURATION_CHROME.rail.title,
    icon: CURATION_CHROME.rail.icon,
    run: () => openCuration(dialogs, 'rail'),
  });
}

export function registerViewsCurationCommand(
  registry: ContributionRegistry,
  dialogs: DialogService,
): Disposable {
  return registry.addCommand({
    id: VIEWS_CUSTOMIZE_COMMAND_ID,
    title: CURATION_CHROME.views.title,
    icon: CURATION_CHROME.views.icon,
    run: () => openCuration(dialogs, 'views'),
  });
}

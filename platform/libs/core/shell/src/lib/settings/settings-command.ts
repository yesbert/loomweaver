import { Disposable } from '@loomweaver/plugin-sdk';
import { OPEN_SETTINGS_COMMAND_ID } from '../commands/host-command-ids';
import { ContributionRegistry } from '../contributions/contribution-registry';
import { SettingsService } from './settings.service';

export function registerOpenSettingsCommand(
  registry: ContributionRegistry,
  settings: SettingsService,
): Disposable {
  return registry.addCommand({
    id: OPEN_SETTINGS_COMMAND_ID,
    title: 'settings.title',
    icon: 'settings',
    popout: true,
    run: () => {
      settings.open();
    },
  });
}

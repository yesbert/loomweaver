import { inject } from '@angular/core';
import { SettingsService } from './settings/settings.service';
import { SettingRow } from './settings/settings-model';
import { SHELL_LAYOUT } from './layout/layout';
import { RailLabelsService } from './regions/rail/rail-labels.service';
import { railNameKey } from './regions/rail/rail-name';
import { ThemeToggle } from './theme/theme-toggle';
import { TextSizeToggle } from './text-size/text-size-toggle';
import { LanguageSwitcher } from './i18n/language-switcher';
import { PermissionsSettings } from './permissions/permissions-settings';

function railLabelRows(): SettingRow[] {
  const layout = inject(SHELL_LAYOUT);
  const labels = inject(RailLabelsService);
  return layout.regions
    .filter((region) => region.type === 'rail')
    .map((region) => ({
      id: `shell.railLabels.${region.id}`,
      label: railNameKey(region, layout),
      description: 'railLabels.desc',
      control: {
        kind: 'toggle',
        value: () => labels.labelled(region.id),
        set: (labelled: boolean) => labels.show(region.id, labelled),
      },
    }));
}

export function registerDefaultSettings(settings: SettingsService): void {
  settings.register({
    id: 'shell.general',
    title: 'settings.general',
    group: 'settings.group.options',
    order: 0,
    rows: [
      {
        id: 'shell.theme',
        label: 'theme.label',
        description: 'theme.desc',
        control: { kind: 'component', component: ThemeToggle },
      },
      {
        id: 'shell.language',
        label: 'language.label',
        description: 'language.desc',
        control: { kind: 'component', component: LanguageSwitcher },
      },
      {
        id: 'shell.textSize',
        label: 'textSize.label',
        description: 'textSize.desc',
        control: { kind: 'component', component: TextSizeToggle },
      },
      ...railLabelRows(),
      {
        id: 'shell.appReset',
        label: 'appReset.title',
        description: 'appReset.desc',
        control: {
          kind: 'button',
          label: 'appReset.action',
          variant: 'danger',
          command: 'shell.app.reset',
        },
      },
    ],
  });
  settings.register({
    id: 'shell.permissions',
    title: 'settings.permissions',
    group: 'settings.group.options',
    order: 10,
    rows: [
      {
        id: 'shell.pluginPermissions',
        label: 'settings.permissions',
        control: {
          kind: 'component',
          component: PermissionsSettings,
          fullWidth: true,
        },
      },
    ],
  });
}

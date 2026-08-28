import { SettingsService } from './settings/settings.service';
import { ThemeToggle } from './theme/theme-toggle';
import { TextSizeToggle } from './text-size/text-size-toggle';
import { LanguageSwitcher } from './i18n/language-switcher';
import { PermissionsSettings } from './permissions/permissions-settings';

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

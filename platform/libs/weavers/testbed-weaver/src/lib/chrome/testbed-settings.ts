import { signal } from '@angular/core';
import { PluginContext } from '@loomweaver/plugin-sdk';

const testbedDensity = signal('comfortable');
const testbedNotifications = signal(true);
const testbedDisplayName = signal('Ada Lovelace');
const testbedFontSize = signal(14);

export function registerSettings(ctx: PluginContext): void {
  ctx.registerSettingsSection({
    id: 'testbed.settings',
    title: 'testbed.name',
    group: 'settings.group.plugins',
    order: 100,
    rows: [
      {
        id: 'testbed.density',
        label: 'testbed.settings.density',
        control: {
          kind: 'select',
          options: [
            { value: 'comfortable', label: 'testbed.settings.densityComfortable' },
            { value: 'compact', label: 'testbed.settings.densityCompact' },
          ],
          value: () => testbedDensity(),
          set: (value) => testbedDensity.set(value),
        },
      },
      {
        id: 'testbed.notifications',
        label: 'testbed.settings.notifications',
        description: 'testbed.settings.notificationsDesc',
        control: {
          kind: 'toggle',
          value: () => testbedNotifications(),
          set: (value) => testbedNotifications.set(value),
        },
      },
      {
        id: 'testbed.displayName',
        label: 'testbed.settings.displayName',
        control: {
          kind: 'text',
          value: () => testbedDisplayName(),
          set: (value) => testbedDisplayName.set(value),
          placeholder: 'testbed.settings.displayNamePlaceholder',
        },
      },
      {
        id: 'testbed.fontSize',
        label: 'testbed.settings.fontSize',
        description: 'testbed.settings.fontSizeDesc',
        control: {
          kind: 'slider',
          value: () => testbedFontSize(),
          set: (value) => testbedFontSize.set(value),
          min: 12,
          max: 20,
          step: 1,
        },
      },
      {
        id: 'testbed.about',
        label: 'testbed.aboutRow',
        control: {
          kind: 'button',
          label: 'testbed.cmd.about',
          command: 'testbed.about',
        },
      },
    ],
  });
}

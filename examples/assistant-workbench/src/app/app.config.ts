import { ApplicationConfig } from '@angular/core';
import {
  provideCapabilityGrants,
  provideCommandPaletteEntry,
  provideLayout,
  providePlugins,
  provideQuickOpenEntry,
  provideRailItems,
  provideShell,
  provideShellRouter,
  provideTranslationNamespaces,
} from '@loomweaver/shell';
import { assistantPlugin } from '../assistant/src';
import { ticketsPlugin } from '../tickets/src';
import { provideProductIdentity } from '@loomweaver/plugin-sdk';
import { layout } from './app.layout';

export const appConfig: ApplicationConfig = {
  providers: [
    provideShellRouter(),
    provideShell(),
    provideLayout(layout),
    provideCommandPaletteEntry(),
    provideQuickOpenEntry(),
    ...provideRailItems({
      id: 'workbench.settings',
      rail: 'primary',
      icon: 'settings',
      title: 'settings.title',
      anchor: 'bottom',
      order: 20,
      command: 'shell.openSettings',
    }),
    provideProductIdentity({
      name: 'Assistant Workbench',
      tagline: 'Built on LoomWeaver',
      logoUrl: 'logo.svg',
    }),
    provideTranslationNamespaces('tickets', 'assistant'),
    provideCapabilityGrants({
      tickets: ['contributions', 'ui', 'navigation'],
      assistant: ['contributions', 'ui', 'automation'],
    }),
    ...providePlugins(ticketsPlugin, assistantPlugin),
  ],
};

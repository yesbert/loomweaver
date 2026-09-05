import { ApplicationConfig } from '@angular/core';
import {
  provideCapabilityGrants,
  provideCommandPaletteEntry,
  provideLayout,
  providePlugins,
  provideQuickOpenEntry,
  provideShell,
  provideShellRouter,
  provideTranslationNamespaces,
  type ShellLayout,
} from '@loomweaver/shell';
import { assistantPlugin } from '../assistant/src';
import { ticketsPlugin } from '../tickets/src';
import { provideProductIdentity } from '@loomweaver/plugin-sdk';
export const layout: ShellLayout = {
  regions: [
    { id: 'top-bar', type: 'bar', dock: 'top' },
    { id: 'primary', type: 'rail', dock: 'left' },
    { id: 'left-panel', type: 'panel', dock: 'left' },
    { id: 'right-panel', type: 'panel', dock: 'right' },
    { id: 'main', type: 'content', dock: 'center' },
    { id: 'status-bar', type: 'bar', dock: 'bottom' },
  ],
};
export const appConfig: ApplicationConfig = {
  providers: [
    provideShellRouter(),
    provideShell(),
    provideLayout(layout),
    provideCommandPaletteEntry(),
    provideQuickOpenEntry(),
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

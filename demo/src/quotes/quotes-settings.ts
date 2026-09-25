import { signal } from '@angular/core';
import { type PluginContext } from '@loomweaver/plugin-sdk';

const STORAGE_KEY = 'demo.quotes.show-margin';
const MARGIN = 'quotes.margin';

function storedChoice(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'false';
  } catch {
    return true;
  }
}

function rememberBestEffort(shown: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(shown));
  } catch {
    return;
  }
}

export function registerQuoteSettings(ctx: PluginContext): void {
  const marginShown = signal(storedChoice());
  ctx.setChildShown(MARGIN, marginShown());
  ctx.registerSettingsSection({
    id: 'quotes.settings',
    title: 'quotes.settings.title',
    group: 'settings.group.plugins',
    rows: [
      {
        id: 'quotes.settings.showMargin',
        label: 'quotes.settings.showMargin',
        description: 'quotes.settings.showMarginDescription',
        control: {
          kind: 'toggle',
          value: () => marginShown(),
          set: (shown) => {
            marginShown.set(shown);
            rememberBestEffort(shown);
            ctx.setChildShown(MARGIN, shown);
          },
        },
      },
    ],
  });
}

import { signal } from '@angular/core';
import { type PluginContext } from '@loomweaver/plugin-sdk';
import { LocalStorageStore } from '@loomweaver/shell';

const STORAGE_KEY = 'demo.quotes.show-margin';
const MARGIN_SURFACE = 'quotes.margin';
const store = new LocalStorageStore();

export function registerQuoteSettings(ctx: PluginContext): void {
  const marginShown = signal(store.peek(STORAGE_KEY) !== 'false');
  ctx.setChildShown(MARGIN_SURFACE, marginShown());
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
            void store.set(STORAGE_KEY, String(shown));
            ctx.setChildShown(MARGIN_SURFACE, shown);
          },
        },
      },
    ],
  });
}

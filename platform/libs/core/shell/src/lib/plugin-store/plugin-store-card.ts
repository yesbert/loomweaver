import { Component, CUSTOM_ELEMENTS_SCHEMA, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { PluginCatalogEntry } from './catalog/catalog-entry';
import { CatalogCountPipe, RelativeDatePipe } from './catalog-figures';
import { PluginIcon } from './plugin-icon';

@Component({
  selector: 'lw-plugin-store-card',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [TranslocoPipe, CatalogCountPipe, RelativeDatePipe, PluginIcon],
  templateUrl: './plugin-store-card.html',
})
export class PluginStoreCard {
  readonly entry = input.required<PluginCatalogEntry>();
  readonly selected = input(false);
  readonly installed = input(false);
  readonly provided = input(false);
  readonly hasUpdate = input(false);
  readonly picked = output<void>();
}

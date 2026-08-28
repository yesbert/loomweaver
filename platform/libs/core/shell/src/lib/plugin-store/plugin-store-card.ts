import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, input, output } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { PluginCatalogEntry } from './installed-plugin';
import { formatCount, formatUpdated } from './format';

@Component({
  selector: 'lw-plugin-store-card',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [TranslocoPipe],
  templateUrl: './plugin-store-card.html',
})
export class PluginStoreCard {
  readonly entry = input.required<PluginCatalogEntry>();
  readonly selected = input(false);
  readonly installed = input(false);
  readonly hasUpdate = input(false);
  readonly picked = output<void>();

  private readonly transloco = inject(TranslocoService);

  protected count(downloads: number): string {
    return formatCount(this.transloco.getActiveLang(), downloads);
  }

  protected updated(iso: string): string {
    return formatUpdated(this.transloco.getActiveLang(), iso);
  }
}

import { Component, inject, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { PluginStoreService } from './plugin-store.service';
import { InstalledPluginList } from './installed-plugin-list';
import { LwButton } from '../elements/button/lw-button';

@Component({
  selector: 'lw-plugin-store-settings',
  imports: [TranslocoPipe, InstalledPluginList, LwButton],
  templateUrl: './plugin-store-settings.html',
})
export class PluginStoreSettings {
  private readonly store = inject(PluginStoreService);

  protected readonly query = signal('');

  protected browse(): void {
    this.store.open();
  }

  protected onQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }
}

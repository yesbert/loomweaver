import { Service, signal } from '@angular/core';

@Service()
export class PluginStoreTitle {
  private readonly value = signal('settings.pluginStore');

  readonly current = this.value.asReadonly();

  set(title: string): void {
    this.value.set(title);
  }
}

import { inject, Service } from '@angular/core';
import { DialogService } from '../dialog/dialog.service';
import { DialogRef } from '../dialog/dialog-ref';
import { PluginStoreDialog } from './plugin-store-dialog';
import { PluginStoreTitle } from './plugin-store-title';

@Service()
export class PluginStoreService {
  private readonly dialogs = inject(DialogService);
  private readonly storeTitle = inject(PluginStoreTitle);

  readonly title = this.storeTitle.current;

  configure(title: string): void {
    this.storeTitle.set(title);
  }

  open(): DialogRef {
    return this.dialogs.open(PluginStoreDialog, {
      title: this.storeTitle.current(),
      bare: true,
      size: 'xl',
      dismissable: true,
    });
  }
}

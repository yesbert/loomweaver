import { DialogRef } from '@loomweaver/plugin-sdk';
import { inject, Service, signal } from '@angular/core';
import { DialogService } from '../dialog/dialog.service';
import {
  DEFAULT_STORE_TITLE,
  PluginStoreDialog,
  PluginStoreDialogData,
} from './plugin-store-dialog';

@Service()
export class PluginStoreService {
  private readonly dialogs = inject(DialogService);
  private readonly storeTitle = signal(DEFAULT_STORE_TITLE);

  readonly title = this.storeTitle.asReadonly();

  configure(title: string): void {
    this.storeTitle.set(title);
  }

  open(): DialogRef {
    const data: PluginStoreDialogData = { title: this.storeTitle() };
    return this.dialogs.open(PluginStoreDialog, {
      title: data.title,
      data,
      bare: true,
      size: 'xl',
    });
  }
}

import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { DialogRef, PRODUCT_IDENTITY, PluginHost } from '@loomweaver/plugin-sdk';

@Component({
  selector: 'lw-testbed-about-dialog',
  imports: [TranslocoPipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './testbed-about-dialog.html',
})
export class TestbedAboutDialog {
  protected readonly identity = inject(PRODUCT_IDENTITY);
  protected readonly host = inject(DialogRef).data as PluginHost;

  protected onUpdate(): void {
    if (this.host.updateAvailable()) {
      void this.host.activateUpdate();
    } else {
      void this.host.checkForUpdate();
    }
  }
}

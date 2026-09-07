import { Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { DialogRef } from '@loomweaver/plugin-sdk';
import { AboutBody } from './about-body';

@Component({
  selector: 'demo-about-dialog',
  imports: [AboutBody, TranslocoPipe],
  templateUrl: './about-dialog.html',
})
export class AboutDialog {
  private readonly ref = inject(DialogRef);

  protected close(): void {
    this.ref.close();
  }
}

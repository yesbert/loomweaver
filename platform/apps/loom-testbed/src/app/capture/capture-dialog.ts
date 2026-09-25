import { Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { DialogRef } from '@loomweaver/plugin-sdk';
import { WorkbenchPicture } from '@loomweaver/shell';

@Component({
  selector: 'lw-testbed-capture-dialog',
  imports: [TranslocoPipe],
  templateUrl: './capture-dialog.html',
})
export class CaptureDialog {
  protected readonly picture = inject(DialogRef).data as WorkbenchPicture;
}

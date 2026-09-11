import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DialogRef } from '@loomweaver/plugin-sdk';
import { WorkbenchPicture } from '@loomweaver/shell';

@Component({
  selector: 'lw-testbed-capture-dialog',
  templateUrl: './capture-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaptureDialog {
  protected readonly picture = inject(DialogRef).data as WorkbenchPicture;
}

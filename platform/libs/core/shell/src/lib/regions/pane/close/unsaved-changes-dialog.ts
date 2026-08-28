import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'lw-unsaved-changes-dialog',
  imports: [TranslocoPipe],
  template: `<p class="text-sm text-content">
    {{ 'retention.unsavedMessage' | transloco }}
  </p>`,
})
export class UnsavedChangesDialog {}

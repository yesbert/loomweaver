import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'lw-close-veto-dialog',
  imports: [TranslocoPipe],
  template: `<p class="text-sm text-content">
    {{ 'retention.vetoPendingMessage' | transloco }}
  </p>`,
})
export class CloseVetoDialog {}

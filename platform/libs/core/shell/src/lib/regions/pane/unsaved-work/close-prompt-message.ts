import { DialogRef } from '@loomweaver/plugin-sdk';
import { Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'lw-close-prompt-message',
  imports: [TranslocoPipe],
  templateUrl: './close-prompt-message.html',
})
export class ClosePromptMessage {
  protected readonly message = inject(DialogRef).data as string;
}

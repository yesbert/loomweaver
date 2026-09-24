import { Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { DialogRef } from '../../../dialog/dialog-ref';

@Component({
  selector: 'lw-close-prompt-message',
  imports: [TranslocoPipe],
  templateUrl: './close-prompt-message.html',
})
export class ClosePromptMessage {
  protected readonly message = inject(DialogRef).data as string;
}

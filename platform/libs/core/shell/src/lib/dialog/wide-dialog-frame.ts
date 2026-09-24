import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  input,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LwButton } from '../elements/button/lw-button';
import { DialogRef } from './dialog-ref';

@Component({
  selector: 'lw-wide-dialog-frame',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [TranslocoPipe, LwButton],
  templateUrl: './wide-dialog-frame.html',
  host: {
    class: 'flex w-full flex-col overflow-hidden',
    '[class]': "ref.maximized() ? 'h-full' : 'h-[80vh] max-h-[85vh]'",
  },
})
export class WideDialogFrame {
  readonly title = input.required<string>();

  protected readonly ref = inject(DialogRef);
}

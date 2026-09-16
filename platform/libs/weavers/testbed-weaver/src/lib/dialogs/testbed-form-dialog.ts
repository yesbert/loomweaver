import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { DialogRef } from '@loomweaver/plugin-sdk';

@Component({
  selector: 'lw-testbed-form-dialog',
  imports: [TranslocoPipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './testbed-form-dialog.html',
})
export class TestbedFormDialog {
  private readonly ref = inject<DialogRef<string>>(DialogRef);

  protected readonly name = signal((this.ref.data as string | undefined) ?? '');

  protected onInput(event: Event): void {
    this.name.set((event.target as HTMLInputElement).value);
  }

  protected onSave(): void {
    this.ref.close(this.name());
  }

  protected onCancel(): void {
    this.ref.close();
  }
}

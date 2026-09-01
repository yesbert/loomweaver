import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { DialogRef } from '../dialog/dialog-ref';

export interface AppResetChoice {
  readonly workspaces: boolean;
}

@Component({
  selector: 'lw-app-reset-dialog',
  imports: [TranslocoPipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './app-reset-dialog.html',
})
export class AppResetDialog {
  private readonly ref = inject<DialogRef<AppResetChoice>>(DialogRef);

  protected readonly offersWorkspaces =
    (this.ref.data as { workspaces?: boolean } | undefined)?.workspaces === true;

  protected readonly workspaces = signal(false);

  protected cancel(): void {
    this.ref.close();
  }

  protected confirm(): void {
    this.ref.close({ workspaces: this.workspaces() });
  }

  protected toggleWorkspaces(event: Event): void {
    this.workspaces.set((event.target as HTMLInputElement).checked);
  }
}

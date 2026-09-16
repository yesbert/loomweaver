import { Component, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { DirtySurface } from '@loomweaver/plugin-sdk';

const savedDraft = signal('');

@Component({
  selector: 'lw-testbed-draft-dialog',
  imports: [TranslocoPipe],
  templateUrl: './testbed-draft-dialog.html',
})
export class TestbedDraftDialog implements DirtySurface {
  protected readonly draft = signal(savedDraft());

  surfaceDirty(): boolean {
    return this.draft() !== savedDraft();
  }

  surfaceSave(): Promise<void> {
    savedDraft.set(this.draft());
    return Promise.resolve();
  }

  protected onInput(event: Event): void {
    this.draft.set((event.target as HTMLTextAreaElement).value);
  }
}

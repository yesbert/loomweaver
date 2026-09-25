import { Component, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { DirtySurface } from '@loomweaver/plugin-sdk';

const savedNotes = signal('');

@Component({
  imports: [TranslocoPipe],
  selector: 'lw-testbed-notes-view',
  templateUrl: './testbed-notes-view.html',
})
export class TestbedNotesView implements DirtySurface {
  protected readonly draft = signal(savedNotes());

  surfaceDirty(): boolean {
    return this.draft() !== savedNotes();
  }

  surfaceSave(): Promise<void> {
    savedNotes.set(this.draft());
    return Promise.resolve();
  }

  protected onInput(event: Event): void {
    this.draft.set((event.target as HTMLTextAreaElement).value);
  }
}

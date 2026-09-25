import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { cleanKey, openRouterKey } from './openrouter-key';

@Component({
  selector: 'app-openrouter-key-form',
  templateUrl: './openrouter-key-form.html',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpenRouterKeyForm {
  protected readonly draft = signal('');

  protected readonly problem = signal(false);

  protected edit(event: Event): void {
    this.draft.set((event.target as HTMLInputElement).value);
  }

  protected use(): void {
    const accepted = openRouterKey.use(this.draft());
    this.problem.set(!accepted && cleanKey(this.draft()).length > 0);
    if (accepted) {
      this.draft.set('');
    }
  }
}

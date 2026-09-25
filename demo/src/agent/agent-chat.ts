import {
  Component,
  ElementRef,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { BEATS, type Beat } from './beats';
import { agentRunner } from './agent-runner';
import { conversation } from './conversation';

@Component({
  selector: 'demo-agent-chat',
  imports: [TranslocoPipe],
  templateUrl: './agent-chat.html',
})
export class AgentChatView {
  private readonly transloco = inject(TranslocoService);
  private readonly scroller =
    viewChild.required<ElementRef<HTMLElement>>('scroller');

  protected readonly beats = BEATS;
  protected readonly lines = conversation.lines;
  protected readonly busy = conversation.running;

  constructor() {
    effect(() => {
      this.lines();
      const element = this.scroller().nativeElement;
      element.scrollTop = element.scrollHeight;
    });
  }

  protected ask(beat: Beat): void {
    void agentRunner.ask(beat, (key, params) => this.transloco.translate(key, params));
  }
}

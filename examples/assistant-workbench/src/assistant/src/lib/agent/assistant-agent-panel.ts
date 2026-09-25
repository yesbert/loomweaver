import {
  ChangeDetectionStrategy,
  Component,
  computed,
  type ElementRef,
  effect,
  signal,
  viewChild,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { EventType, type AGUIEvent, type Tool, type ToolMessage } from '@ag-ui/core';
import { createAgent, MODEL } from './assistant-agent';
import { assistantTools } from './assistant-connection';
import { openRouterKey } from './openrouter-key';
import { OpenRouterKeyForm } from './openrouter-key-form';

interface Line {
  readonly kind: 'you' | 'agent' | 'call' | 'result';
  readonly text: string;
  readonly args?: string;
  readonly failed?: boolean;
}

@Component({
  selector: 'lw-assistant-agent-panel',
  templateUrl: './assistant-agent-panel.html',
  imports: [TranslocoPipe, OpenRouterKeyForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssistantAgentPanel {
  protected readonly model = MODEL;

  protected readonly key = openRouterKey.value;

  protected readonly keyEnding = computed(() => this.key().slice(-4));

  protected readonly draft = signal('');

  protected readonly offered = signal<readonly Tool[]>([]);

  protected readonly lines = signal<readonly Line[]>([]);

  protected readonly busy = signal(false);

  private readonly agent = createAgent();

  private readonly transcript = viewChild<ElementRef<HTMLElement>>('transcript');

  private runs = 0;

  constructor() {
    this.refreshOffered();
    effect(() => {
      this.lines();
      const box = this.transcript()?.nativeElement;
      if (box) {
        box.scrollTop = box.scrollHeight;
      }
    });
  }

  protected refreshOffered(): void {
    this.offered.set(assistantTools()?.list() ?? []);
  }

  protected forgetKey(): void {
    openRouterKey.forget();
  }

  protected edit(event: Event): void {
    this.draft.set((event.target as HTMLTextAreaElement).value);
  }

  protected submit(event: Event): void {
    event.preventDefault();
    const prompt = this.draft().trim();
    if (!prompt) {
      return;
    }
    this.draft.set('');
    void this.send(prompt);
  }

  private async send(prompt: string): Promise<void> {
    const tools = assistantTools();
    const key = this.key();
    if (!tools || this.busy() || !key) {
      return;
    }
    this.busy.set(true);
    try {
      const offered = tools.list();
      this.offered.set(offered);
      this.push({ kind: 'you', text: prompt });
      const request = { runId: `run-${++this.runs}`, prompt, tools: offered, key };
      for await (const event of this.agent.ask(request)) {
        this.draw(event);
        const answer = await tools.receive(event);
        this.showAnswer(answer);
        if (answer) {
          this.agent.answer(answer);
        }
      }
      for (let left = await tools.flush(); left; left = await tools.flush()) {
        this.showAnswer(left);
      }
    } finally {
      this.busy.set(false);
    }
  }

  private showAnswer(message: ToolMessage | null): void {
    if (message) {
      this.push({
        kind: 'result',
        text: message.error ?? message.content,
        failed: Boolean(message.error),
      });
    }
  }

  private draw(event: AGUIEvent): void {
    switch (event.type) {
      case EventType.TEXT_MESSAGE_START:
        this.push({ kind: 'agent', text: '' });
        break;
      case EventType.TEXT_MESSAGE_CONTENT:
        this.grow('text', event.delta);
        break;
      case EventType.TOOL_CALL_START:
        this.push({ kind: 'call', text: event.toolCallName, args: '' });
        break;
      case EventType.TOOL_CALL_ARGS:
        this.grow('args', event.delta);
        break;
      case EventType.RUN_ERROR:
        this.push({ kind: 'result', text: event.message, failed: true });
        break;
      default:
        break;
    }
  }

  private push(line: Line): void {
    this.lines.update((all) => [...all, line]);
  }

  private grow(field: 'text' | 'args', delta: string): void {
    this.lines.update((all) => {
      const last = all[all.length - 1];
      return [...all.slice(0, -1), { ...last, [field]: `${last[field] ?? ''}${delta}` }];
    });
  }
}

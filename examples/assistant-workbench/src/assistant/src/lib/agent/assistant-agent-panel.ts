import {
  ChangeDetectionStrategy,
  Component,
  computed,
  type ElementRef,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { contentToText, EventType, type AGUIEvent, type Tool, type ToolMessage } from '@ag-ui/core';
import type { CommandTools } from '@loomweaver/ag-ui';
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
  selector: 'app-assistant-agent-panel',
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

  private readonly transloco = inject(TranslocoService);

  private readonly agent = createAgent((key, params) => this.transloco.translate(key, params));

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
    const tools = assistantTools();
    const key = this.key();
    if (!prompt || !tools || !key || this.busy()) {
      return;
    }
    this.draft.set('');
    void this.send(tools, prompt, key);
  }

  private async send(tools: CommandTools, prompt: string, key: string): Promise<void> {
    this.busy.set(true);
    try {
      await this.run(tools, prompt, key);
    } catch (failure) {
      this.push({
        kind: 'result',
        text: failure instanceof Error ? failure.message : String(failure),
        failed: true,
      });
    } finally {
      this.busy.set(false);
    }
  }

  private async run(tools: CommandTools, prompt: string, key: string): Promise<void> {
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
    } finally {
      for (let left = await tools.flush(); left; left = await tools.flush()) {
        this.showAnswer(left);
        this.agent.answer(left);
      }
    }
  }

  private showAnswer(message: ToolMessage | null): void {
    if (message) {
      this.push({
        kind: 'result',
        text: message.error ?? contentToText(message.content),
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

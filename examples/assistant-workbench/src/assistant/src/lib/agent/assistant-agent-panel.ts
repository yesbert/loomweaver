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
import { EventType, type BaseEvent, type Tool, type ToolMessage } from '@ag-ui/core';
import { assistantAgent } from './assistant-agent';
import { createAgent, MODEL } from './assistant-agent-source';
import { cleanKey, looksLikeKey } from './openrouter-key';

const KEY_STORAGE = 'assistant-workbench.openrouter-key';

interface Line {
  readonly kind: 'you' | 'agent' | 'call' | 'result';
  readonly text: string;
  readonly args?: string;
  readonly failed?: boolean;
}

@Component({
  selector: 'lw-assistant-agent-panel',
  templateUrl: './assistant-agent-panel.html',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssistantAgentPanel {
  protected readonly model = MODEL;

  protected readonly key = signal(localStorage.getItem(KEY_STORAGE) ?? '');

  protected readonly keyEnding = computed(() => this.key().slice(-4));

  protected readonly keyProblem = signal(false);

  protected readonly offered = signal<readonly Tool[]>([]);

  protected readonly lines = signal<readonly Line[]>([]);

  protected readonly busy = signal(false);

  private readonly agent = createAgent();

  private readonly transcript = viewChild<ElementRef<HTMLElement>>('transcript');

  private runs = 0;

  constructor() {
    this.offered.set(assistantAgent()?.list() ?? []);
    effect(() => {
      this.lines();
      const box = this.transcript()?.nativeElement;
      if (box) {
        box.scrollTop = box.scrollHeight;
      }
    });
  }

  protected useKey(field: HTMLInputElement): void {
    const key = cleanKey(field.value);
    if (!looksLikeKey(key)) {
      this.keyProblem.set(key.length > 0);
      return;
    }
    this.keyProblem.set(false);
    localStorage.setItem(KEY_STORAGE, key);
    this.key.set(key);
    field.value = '';
  }

  protected forgetKey(): void {
    localStorage.removeItem(KEY_STORAGE);
    this.key.set('');
  }

  protected submit(event: Event, field: HTMLTextAreaElement): void {
    event.preventDefault();
    const prompt = field.value.trim();
    if (!prompt) {
      return;
    }
    field.value = '';
    void this.send(prompt);
  }

  private async send(prompt: string): Promise<void> {
    const tools = assistantAgent();
    const key = this.key() || localStorage.getItem(KEY_STORAGE) || '';
    if (!tools || this.busy() || !key) {
      return;
    }
    this.busy.set(true);
    try {
      const offered = tools.list();
      this.offered.set(offered);
      this.push({ kind: 'you', text: prompt });
      const request = {
        runId: `run-${++this.runs}`,
        prompt,
        tools: offered,
        key,
        receive: (event: BaseEvent) => this.receive(tools.receive(event)),
      };
      for await (const event of this.agent.ask(request)) {
        this.draw(event);
      }
      await this.receive(tools.flush());
    } finally {
      this.busy.set(false);
    }
  }

  private async receive(answer: Promise<ToolMessage | null>): Promise<ToolMessage | null> {
    const message = await answer;
    if (message) {
      this.push({
        kind: 'result',
        text: message.error ?? message.content,
        failed: Boolean(message.error),
      });
    }
    return message;
  }

  private draw(event: BaseEvent): void {
    const raw = event as unknown as Record<string, unknown>;
    switch (event.type) {
      case EventType.TEXT_MESSAGE_START:
        this.push({ kind: 'agent', text: '' });
        break;
      case EventType.TEXT_MESSAGE_CONTENT:
        this.grow('text', String(raw['delta'] ?? ''));
        break;
      case EventType.TOOL_CALL_START:
        this.push({ kind: 'call', text: String(raw['toolCallName'] ?? ''), args: '' });
        break;
      case EventType.TOOL_CALL_ARGS:
        this.grow('args', String(raw['delta'] ?? ''));
        break;
      case EventType.RUN_ERROR:
        this.push({ kind: 'result', text: String(raw['message'] ?? ''), failed: true });
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

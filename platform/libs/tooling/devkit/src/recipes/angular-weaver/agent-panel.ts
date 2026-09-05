import type { ResolvedWeaver } from './recipe';

export function panelFile(w: ResolvedWeaver): string {
  return `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { EventType, type BaseEvent, type Tool } from '@ag-ui/core';
import { ${w.propertyName}Agent } from './${w.id}-agent';
import { askAgent } from './${w.id}-agent-source';

interface Line {
  readonly kind: 'you' | 'agent' | 'call' | 'result' | 'note';
  readonly text: string;
  readonly args?: string;
  readonly failed?: boolean;
}

@Component({
  selector: '${w.prefix}-${w.id}-agent-panel',
  templateUrl: './${w.id}-agent-panel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ${w.className}AgentPanel {
  protected readonly offered = signal<readonly Tool[]>([]);

  protected readonly lines = signal<readonly Line[]>([]);

  protected readonly busy = signal(false);

  private runs = 0;

  constructor() {
    this.refreshOffered();
  }

  // The list is read again whenever the panel gains focus, because the weaver's own translations
  // and other plugins' commands may arrive after this component was built.
  protected refreshOffered(): void {
    this.offered.set(${w.propertyName}Agent()?.list() ?? []);
  }

  protected async ask(name: string): Promise<void> {
    const tools = ${w.propertyName}Agent();
    if (!tools || this.busy()) {
      return;
    }
    this.busy.set(true);
    try {
      // Ask for the list again, every run. What a plugin may reach changes as plugins load and the
      // session changes, and a list kept from earlier offers actions that are no longer there.
      const offered = tools.list();
      this.offered.set(offered);
      this.push({ kind: 'you', text: \`Run \${name}\` });
      this.push({ kind: 'note', text: \`\${offered.length} tool(s) offered right now\` });

      const request = {
        runId: \`run-\${++this.runs}\`,
        prompt: name,
        tools: offered,
      };
      for await (const event of askAgent(request)) {
        this.draw(event);
        // Every event goes over, unfiltered. The adapter decides which ones matter; a filter here is
        // how a call ends up half-assembled.
        const message = await tools.receive(event);
        if (message) {
          this.push({
            kind: 'result',
            text: message.error ?? message.content,
            failed: Boolean(message.error),
          });
        }
      }
      // A run that ends without its closing event leaves a call open; flush() answers it.
      const last = await tools.flush();
      if (last) {
        this.push({
          kind: 'result',
          text: last.error ?? last.content,
          failed: Boolean(last.error),
        });
      }
    } finally {
      this.busy.set(false);
    }
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
        this.push({
          kind: 'call',
          text: String(raw['toolCallName'] ?? ''),
          args: '',
        });
        break;
      case EventType.TOOL_CALL_ARGS:
        this.grow('args', String(raw['delta'] ?? ''));
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
      return [
        ...all.slice(0, -1),
        { ...last, [field]: \`\${last[field] ?? ''}\${delta}\` },
      ];
    });
  }
}
`;
}

export function panelTemplateFile(w: ResolvedWeaver): string {
  return `<div class="flex h-full flex-col gap-3" (focusin)="refreshOffered()">
  <p
    class="shrink-0 rounded-md border border-border bg-surface-raised px-3 py-2 text-xs text-content-muted"
  >
    This is a stand-in, not an assistant. It speaks the protocol so you can watch the whole path;
    replace <code class="text-content">${w.id}-agent-source.ts</code> with your own transport.
  </p>

  <div class="min-h-0 flex-1 overflow-auto">
    <ul class="flex flex-col gap-2.5">
      @for (line of lines(); track $index) {
        @if (line.kind === 'you') {
          <li class="max-w-full self-end rounded-lg bg-brand-fill px-3 py-2 text-sm text-on-brand">
            {{ line.text }}
          </li>
        } @else if (line.kind === 'agent') {
          <li
            class="max-w-full self-start rounded-lg bg-surface-raised px-3 py-2 text-sm text-content"
          >
            {{ line.text }}
          </li>
        } @else if (line.kind === 'call') {
          <li
            class="rounded-md border border-border px-3 py-2 font-mono text-xs break-all text-content-muted"
          >
            {{ line.text }}<span class="text-content-faint">({{ line.args }})</span>
          </li>
        } @else if (line.kind === 'result') {
          <li
            class="px-1 text-xs"
            [class.text-negative]="line.failed"
            [class.text-content-muted]="!line.failed"
          >
            {{ line.text }}
          </li>
        } @else {
          <li class="px-1 text-xs text-content-faint">{{ line.text }}</li>
        }
      } @empty {
        <li class="px-1 py-6 text-center text-sm text-content-muted">
          Pick something below and watch the call go through.
        </li>
      }
    </ul>
  </div>

  <div class="flex shrink-0 flex-col gap-2 border-t border-border pt-3">
    <span class="px-1 text-xs font-medium text-content-muted">
      Offered right now ({{ offered().length }})
    </span>
    @for (tool of offered(); track tool.name) {
      <button
        type="button"
        class="lw-btn lw-btn--default lw-btn--sm h-auto justify-start py-2 text-left whitespace-normal"
        [disabled]="busy()"
        (click)="ask(tool.name)"
      >
        {{ tool.description }}
      </button>
    } @empty {
      <span class="px-1 text-xs text-content-faint">
        Nothing is offered. A command reaches this list only when it is registered with
        <code class="text-content">callable: true</code>, and reaching another plugin's commands
        needs the <code class="text-content">automation</code> capability granted.
      </span>
    }
  </div>
</div>
`;
}

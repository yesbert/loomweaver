import { signal } from '@angular/core';
import { commandTools, consentPolicy, type CommandTools } from '@loomweaver/ag-ui';
import type { PluginContext } from '@loomweaver/plugin-sdk';

export function connectAssistant(ctx: PluginContext): CommandTools {
  return commandTools(ctx, {
    before: consentPolicy(() =>
      ctx.ui.confirm({
        title: 'assistant.agent.confirm.title',
        message: 'assistant.agent.confirm.message',
        confirmLabel: 'assistant.agent.confirm.yes',
        cancelLabel: 'assistant.agent.confirm.no',
        tone: 'warning',
      }),
    ),
  });
}

export const assistantTools = signal<CommandTools | null>(null);

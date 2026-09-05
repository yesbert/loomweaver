import { signal } from '@angular/core';
import {
  commandTools,
  type CommandTools,
  type PendingToolCall,
  type ToolDecision,
} from '@loomweaver/ag-ui';
import type { PluginContext } from '@loomweaver/plugin-sdk';

const CONSEQUENTIAL = new Set(['tickets.reply']);

export function assistantConnection(ctx: PluginContext): CommandTools {
  return commandTools(ctx, { before: (call) => decide(ctx, call) });
}

export const assistantAgent = signal<CommandTools | null>(null);

async function decide(ctx: PluginContext, call: PendingToolCall): Promise<ToolDecision> {
  if (!CONSEQUENTIAL.has(call.commandId)) {
    return { decision: 'run' };
  }
  const yes = await ctx.ui.confirm({
    title: 'assistant.agent.confirm.title',
    message: 'assistant.agent.confirm.message',
    confirmLabel: 'assistant.agent.confirm.yes',
    cancelLabel: 'assistant.agent.confirm.no',
    tone: 'warning',
  });
  return yes
    ? { decision: 'run' }
    : { decision: 'decline', reason: 'the person at the keyboard said no.' };
}

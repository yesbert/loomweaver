import { signal } from '@angular/core';
import {
  commandTools,
  type CommandTools,
  type PendingToolCall,
  type ToolDecision,
} from '@loomweaver/ag-ui';
import type { PluginContext } from '@loomweaver/plugin-sdk';

export function connectAssistant(ctx: PluginContext): CommandTools {
  return commandTools(ctx, { before: (call) => decide(ctx, call) });
}

export const assistantTools = signal<CommandTools | null>(null);

async function decide(ctx: PluginContext, call: PendingToolCall): Promise<ToolDecision> {
  if (call.agentConsent === 'never') {
    return {
      decision: 'decline',
      reason: 'an agent may not run this one on its own word.',
    };
  }
  if (call.agentConsent !== 'ask' && call.agentConsent !== 'ask-always') {
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

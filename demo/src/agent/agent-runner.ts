import { EventType, type AGUIEvent, type ToolMessage } from '@ag-ui/core';
import {
  commandTools,
  type CommandTools,
  type PendingToolCall,
  type ToolDecision,
} from '@loomweaver/ag-ui';
import type { PluginContext } from '@loomweaver/plugin-sdk';
import type { Beat } from './beats';
import { conversation } from './conversation';
import { answering, asking } from './ag-ui-events';

const TEXT_PACE = 35;
const ARGUMENT_PACE = 55;
const TURN_PACE = 140;

export type Say = (key: string, params?: Record<string, unknown>) => string;

let ctx: PluginContext | undefined;
let tools: CommandTools | undefined;
let runs = 0;


export const agentRunner = {
  bind(next: PluginContext): void {
    ctx = next;
    tools = commandTools(next, { before: consentFor });
  },
  unbind(): void {
    ctx = undefined;
    tools = undefined;
  },
  async ask(beat: Beat, say: Say): Promise<void> {
    if (!tools || !conversation.begin()) {
      return;
    }
    const runId = `run-${++runs}`;
    const words = beat.words?.() ?? {};
    const speech = (part: string) => say(`agent.beat.${beat.id}.${part}`, words);

    try {
      conversation.push({ kind: 'visitor', text: speech('prompt') });
      const offered = tools.list();
      conversation.push({
        kind: 'note',
        text: say('agent.offered', { count: offered.length }),
      });
      if (!offered.some((tool) => tool.name === beat.call.commandId)) {
        conversation.push({
          kind: 'note',
          text: say('agent.notOffered', { command: beat.call.commandId }),
        });
      }
      if (beat.warnsBeforeCalling) {
        conversation.push({ kind: 'note', text: speech('warns') });
      }

      const answer = await drive(asking(beat, runId, speech('says')), say);
      const closes = speech(answer?.error ? 'refused' : 'closes');
      await drive(answering(`${runId}.reply`, closes), say);
    } finally {
      conversation.end();
    }
  },
};

async function drive(events: Generator<AGUIEvent>, say: Say): Promise<ToolMessage | null> {
  let answer: ToolMessage | null = null;
  for (const event of events) {
    await pace(event);
    draw(event);
    const message = await tools?.receive(event);
    if (message) {
      answer = message;
      conversation.push({
        kind: 'result',
        text: say(
          message.error ? 'agent.result.refused' : 'agent.result.answered',
          { content: message.content },
        ),
        failed: Boolean(message.error),
      });
    }
  }
  return answer;
}

function draw(event: AGUIEvent): void {
  switch (event.type) {
    case EventType.TEXT_MESSAGE_START:
      conversation.push({ kind: 'agent', text: '' });
      break;
    case EventType.TEXT_MESSAGE_CONTENT:
      conversation.grow('text', event.delta);
      break;
    case EventType.TOOL_CALL_START:
      conversation.push({ kind: 'call', text: event.toolCallName, args: '' });
      break;
    case EventType.TOOL_CALL_ARGS:
      conversation.grow('args', event.delta);
      break;
    default:
      break;
  }
}

function pace(event: AGUIEvent): Promise<void> {
  const wait =
    event.type === EventType.TEXT_MESSAGE_CONTENT
      ? TEXT_PACE
      : event.type === EventType.TOOL_CALL_ARGS
        ? ARGUMENT_PACE
        : TURN_PACE;
  return new Promise((done) => setTimeout(done, wait));
}

async function consentFor(call: PendingToolCall): Promise<ToolDecision> {
  if (call.agentConsent === 'never') {
    return {
      decision: 'decline',
      reason: 'an agent may not run this one on its own word.',
    };
  }
  const asks =
    call.agentConsent === 'ask' || call.agentConsent === 'ask-always';
  if (!ctx || !asks) {
    return { decision: 'run' };
  }
  const yes = await ctx.ui.confirm({
    title: 'agent.confirm.title',
    message: 'agent.confirm.message',
    confirmLabel: 'agent.confirm.yes',
    cancelLabel: 'agent.confirm.no',
    tone: 'warning',
  });
  return yes
    ? { decision: 'run' }
    : { decision: 'decline', reason: 'the person at the keyboard said no.' };
}

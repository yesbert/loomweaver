import { EventType, type AGUIEvent, type ToolMessage } from '@ag-ui/core';
import type { CommandTools } from '@loomweaver/ag-ui';
import type { CommandArguments, PluginContext } from '@loomweaver/plugin-sdk';
import { connectAssistant } from './assistant-connection';

interface Asked {
  readonly id: string;
  readonly args?: CommandArguments;
}

function contextThat(confirms: boolean, ran: Asked[]): PluginContext {
  return {
    invocableCommands: () => [
      {
        id: 'tickets.reply',
        title: 'Reply to ticket',
        description: 'Sends a reply to the customer.',
        agentConsent: 'ask',
      },
    ],
    invokeCommand: (id: string, args?: CommandArguments) => {
      ran.push({ id, args });
      return Promise.resolve({ outcome: 'answered', value: 'it ran' });
    },
    ui: { confirm: () => Promise.resolve(confirms) },
  } as unknown as PluginContext;
}

function streamedCall(toolCallId: string, ...deltas: string[]): AGUIEvent[] {
  return [
    { type: EventType.TOOL_CALL_START, toolCallId, toolCallName: 'tickets.reply' },
    ...deltas.map((delta): AGUIEvent => ({ type: EventType.TOOL_CALL_ARGS, toolCallId, delta })),
    { type: EventType.TOOL_CALL_END, toolCallId },
  ];
}

async function answersTo(tools: CommandTools, events: AGUIEvent[]): Promise<ToolMessage[]> {
  const answers: ToolMessage[] = [];
  for (const event of events) {
    const answer = await tools.receive(event);
    if (answer) {
      answers.push(answer);
    }
  }
  return answers;
}

describe('connectAssistant', () => {
  it('offers what the workbench offers', () => {
    const tools = connectAssistant(contextThat(true, []));
    expect(tools.list().map((tool) => tool.name)).toEqual(['tickets.reply']);
  });

  it('assembles a call from its events and answers with the outcome', async () => {
    const ran: Asked[] = [];
    const tools = connectAssistant(contextThat(true, ran));

    const [answer] = await answersTo(tools, streamedCall('c1', '{"who"', ':"you"}'));

    expect(ran).toEqual([{ id: 'tickets.reply', args: { who: 'you' } }]);
    expect(answer?.content).toBe('it ran');
    expect(answer?.error).toBeUndefined();
  });

  it('never reaches the workbench when a consequential call is declined', async () => {
    const ran: Asked[] = [];
    const tools = connectAssistant(contextThat(false, ran));

    const [answer] = await answersTo(tools, streamedCall('c2', '{}'));

    expect(ran).toEqual([]);
    expect(answer?.error).toContain('did not run');
  });
});

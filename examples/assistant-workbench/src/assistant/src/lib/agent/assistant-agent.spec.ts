import { EventType, type BaseEvent } from '@ag-ui/core';
import type { CommandArguments, PluginContext } from '@loomweaver/plugin-sdk';
import { assistantConnection } from './assistant-agent';

interface Asked {
  readonly id: string;
  readonly args?: CommandArguments;
}

function contextThat(confirms: boolean, ran: Asked[]): PluginContext {
  return {
    invocableCommands: () => [
      { id: 'tickets.reply', title: 'Reply to ticket', description: 'Sends a reply to the customer.' },
    ],
    invokeCommand: (id: string, args?: CommandArguments) => {
      ran.push({ id, args });
      return Promise.resolve({ outcome: 'answered', value: 'it ran' });
    },
    ui: { confirm: () => Promise.resolve(confirms) },
  } as unknown as PluginContext;
}

function event(type: EventType, fields: Record<string, unknown>): BaseEvent {
  return { type, ...fields } as unknown as BaseEvent;
}

describe('assistantConnection', () => {
  it('offers what the workbench offers', () => {
    const tools = assistantConnection(contextThat(true, []));
    expect(tools.list().map((tool) => tool.name)).toEqual(['tickets.reply']);
  });

  it('assembles a call from its events and answers with the outcome', async () => {
    const ran: Asked[] = [];
    const tools = assistantConnection(contextThat(true, ran));

    expect(
      await tools.receive(
        event(EventType.TOOL_CALL_START, {
          toolCallId: 'c1',
          toolCallName: 'tickets.reply',
        }),
      ),
    ).toBeNull();
    await tools.receive(
      event(EventType.TOOL_CALL_ARGS, { toolCallId: 'c1', delta: '{"who"' }),
    );
    await tools.receive(
      event(EventType.TOOL_CALL_ARGS, { toolCallId: 'c1', delta: ':"you"}' }),
    );
    const answer = await tools.receive(
      event(EventType.TOOL_CALL_END, { toolCallId: 'c1' }),
    );

    expect(ran).toEqual([{ id: 'tickets.reply', args: { who: 'you' } }]);
    expect(answer?.content).toBe('it ran');
    expect(answer?.error).toBeUndefined();
  });

  it('never reaches the workbench when a consequential call is declined', async () => {
    const ran: Asked[] = [];
    const tools = assistantConnection(contextThat(false, ran));

    await tools.receive(
      event(EventType.TOOL_CALL_START, {
        toolCallId: 'c2',
        toolCallName: 'tickets.reply',
      }),
    );
    await tools.receive(
      event(EventType.TOOL_CALL_ARGS, { toolCallId: 'c2', delta: '{}' }),
    );
    const answer = await tools.receive(
      event(EventType.TOOL_CALL_END, { toolCallId: 'c2' }),
    );

    expect(ran).toEqual([]);
    expect(answer?.error).toContain('did not run');
  });
});

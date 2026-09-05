import { EventType, type BaseEvent, type ToolMessage } from '@ag-ui/core';
import { createAgent } from './assistant-agent-source';

interface Sent {
  readonly messages: readonly Record<string, unknown>[];
  readonly tools: readonly { readonly function: { readonly name: string } }[];
}

function answering(turns: readonly unknown[]): { fetchLike: typeof fetch; sent: Sent[] } {
  const sent: Sent[] = [];
  const queue = [...turns];
  const fetchLike: typeof fetch = (_input, init) => {
    sent.push(JSON.parse(String(init?.body)) as Sent);
    const message = queue.shift();
    return Promise.resolve(
      new Response(JSON.stringify({ choices: [{ message }] }), { status: 200 }),
    );
  };
  return { fetchLike, sent };
}

async function run(
  fetchLike: typeof fetch,
  receive: (event: BaseEvent) => Promise<ToolMessage | null>,
): Promise<BaseEvent[]> {
  const seen: BaseEvent[] = [];
  const agent = createAgent(fetchLike);
  for await (const event of agent.ask({
    runId: 'r1',
    prompt: 'assign T-1041 to dana',
    tools: [{ name: 'tickets.assign', description: 'Assigns a ticket.', parameters: {} }],
    key: 'k',
    receive,
  })) {
    seen.push(event);
  }
  return seen;
}

describe('createAgent', () => {
  it('offers the tools with names a model may call, and maps a call back to the command id', async () => {
    const { fetchLike, sent } = answering([
      {
        role: 'assistant',
        content: null,
        tool_calls: [
          { id: 'c1', type: 'function', function: { name: 'tickets__assign', arguments: '{"number":"T-1041","to":"dana"}' } },
        ],
      },
      { role: 'assistant', content: 'Done.' },
    ]);
    const received: BaseEvent[] = [];
    const seen = await run(fetchLike, (event) => {
      received.push(event);
      return Promise.resolve(
        event.type === EventType.TOOL_CALL_END
          ? { id: 'm1', role: 'tool', toolCallId: 'c1', content: '{"status":"in progress"}' }
          : null,
      );
    });

    expect(sent[0].tools.map((tool) => tool.function.name)).toEqual(['tickets__assign']);
    expect(received.map((event) => event.type)).toEqual([
      EventType.TOOL_CALL_START,
      EventType.TOOL_CALL_ARGS,
      EventType.TOOL_CALL_END,
    ]);
    expect((received[0] as unknown as { toolCallName: string }).toolCallName).toBe('tickets.assign');
    expect(seen.map((event) => event.type)).toEqual([
      EventType.RUN_STARTED,
      EventType.TOOL_CALL_START,
      EventType.TOOL_CALL_ARGS,
      EventType.TOOL_CALL_END,
      EventType.TOOL_CALL_RESULT,
      EventType.TEXT_MESSAGE_START,
      EventType.TEXT_MESSAGE_CONTENT,
      EventType.TEXT_MESSAGE_END,
      EventType.RUN_FINISHED,
    ]);
    const second = sent[1].messages;
    expect(second[second.length - 1]).toEqual({ role: 'tool', tool_call_id: 'c1', content: '{"status":"in progress"}' });
  });

  it('reports a failed request as a run error instead of throwing', async () => {
    const fetchLike: typeof fetch = () =>
      Promise.resolve(new Response(JSON.stringify({ error: { message: 'rate limited' } }), { status: 429 }));
    const seen = await run(fetchLike, () => Promise.resolve(null));
    expect(seen.map((event) => event.type)).toEqual([EventType.RUN_STARTED, EventType.RUN_ERROR]);
    expect((seen[1] as unknown as { message: string }).message).toBe('rate limited');
  });
});

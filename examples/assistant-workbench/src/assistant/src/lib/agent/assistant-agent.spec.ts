import { EventType, type AGUIEvent, type ToolMessage } from '@ag-ui/core';
import { createAgent } from './assistant-agent';

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
  receive: (event: AGUIEvent) => ToolMessage | null,
): Promise<AGUIEvent[]> {
  const seen: AGUIEvent[] = [];
  const agent = createAgent(fetchLike);
  for await (const event of agent.ask({
    runId: 'r1',
    prompt: 'assign T-1041 to dana',
    tools: [{ name: 'tickets.assign', description: 'Assigns a ticket.', parameters: {} }],
    key: 'k',
  })) {
    seen.push(event);
    const answer = receive(event);
    if (answer) {
      agent.answer(answer);
    }
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
    const seen = await run(fetchLike, (event) =>
      event.type === EventType.TOOL_CALL_END
        ? { id: 'm1', role: 'tool', toolCallId: 'c1', content: '{"status":"in progress"}' }
        : null,
    );

    expect(sent[0].tools.map((tool) => tool.function.name)).toEqual(['tickets__assign']);
    const start = seen.find((event) => event.type === EventType.TOOL_CALL_START);
    expect(start?.type === EventType.TOOL_CALL_START && start.toolCallName).toBe('tickets.assign');
    expect(seen.map((event) => event.type)).toEqual([
      EventType.RUN_STARTED,
      EventType.TOOL_CALL_START,
      EventType.TOOL_CALL_ARGS,
      EventType.TOOL_CALL_END,
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
    const seen = await run(fetchLike, () => null);
    expect(seen.map((event) => event.type)).toEqual([EventType.RUN_STARTED, EventType.RUN_ERROR]);
    expect(seen[1].type === EventType.RUN_ERROR && seen[1].message).toBe('rate limited');
  });

  it('says where the model is set when OpenRouter no longer has it', async () => {
    const fetchLike: typeof fetch = () =>
      Promise.resolve(
        new Response(JSON.stringify({ error: { message: 'This model is unavailable for free.' } }), {
          status: 404,
        }),
      );
    const seen = await run(fetchLike, () => null);
    const message = seen[1].type === EventType.RUN_ERROR ? seen[1].message : '';
    expect(message).toContain('This model is unavailable for free.');
    expect(message).toContain('MODEL in assistant-agent.ts');
    expect(message).toContain('supported_parameters=tools');
  });
});

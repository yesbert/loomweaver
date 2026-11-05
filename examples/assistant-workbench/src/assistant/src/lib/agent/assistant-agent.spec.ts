import { EventType, type AGUIEvent, type ToolMessage } from '@ag-ui/core';
import de from '../i18n/de.json';
import en from '../i18n/en.json';
import { createAgent, type Wording } from './assistant-agent';

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

function wordingOf(catalogue: object): Wording {
  return (key, params = {}) => {
    const sentence = key
      .split('.')
      .slice(1)
      .reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], catalogue);
    return typeof sentence === 'string'
      ? sentence.replace(/{{(\w+)}}/g, (_match, name: string) => String(params[name]))
      : key;
  };
}

async function run(
  fetchLike: typeof fetch,
  receive: (event: AGUIEvent) => ToolMessage | null,
  { wording = wordingOf(en), key = 'k' }: { wording?: Wording; key?: string } = {},
): Promise<AGUIEvent[]> {
  const seen: AGUIEvent[] = [];
  const agent = createAgent(wording, fetchLike);
  for await (const event of agent.ask({
    runId: 'r1',
    prompt: 'assign T-1041 to dana',
    tools: [{ name: 'tickets__assign', description: 'Assigns a ticket.', parameters: {} }],
    key,
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
  it('offers the tools under the names the connection gave them, and hands a call back under the same name', async () => {
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
    expect(start?.type === EventType.TOOL_CALL_START && start.toolCallName).toBe('tickets__assign');
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

  it('gives a call from a run that broke off its result before the next run asks', async () => {
    const call = { id: 'c1', type: 'function', function: { name: 'tickets__assign', arguments: '{}' } };
    const { fetchLike, sent } = answering([
      { role: 'assistant', content: null, tool_calls: [call, { ...call, id: 'c2' }] },
      { role: 'assistant', content: 'Done.' },
    ]);
    const agent = createAgent(wordingOf(en), fetchLike);
    const request = { runId: 'r1', prompt: 'assign T-1041 to dana', tools: [], key: 'k' };
    for await (const event of agent.ask(request)) {
      if (event.type === EventType.TOOL_CALL_END) {
        break;
      }
    }
    agent.answer({ id: 'm1', role: 'tool', toolCallId: 'c1', content: '', error: 'this call was left open' });

    for await (const event of agent.ask({ ...request, runId: 'r2', prompt: 'and now?' })) {
      void event;
    }

    expect(sent[1].messages.slice(2).map((message) => [message['role'], message['tool_call_id'], message['content']])).toEqual([
      ['assistant', undefined, null],
      ['tool', 'c1', 'this call was left open'],
      ['tool', 'c2', 'the workbench did not answer this call.'],
      ['user', undefined, 'and now?'],
    ]);
  });

  it('repairs a call left without a result although an earlier round answered one under the same id', async () => {
    const call = { id: 'call_0', type: 'function', function: { name: 'tickets__assign', arguments: '{}' } };
    const { fetchLike, sent } = answering([
      { role: 'assistant', content: null, tool_calls: [call] },
      { role: 'assistant', content: 'Done.' },
      { role: 'assistant', content: null, tool_calls: [call] },
      { role: 'assistant', content: 'Done again.' },
    ]);
    const agent = createAgent(wordingOf(en), fetchLike);
    const request = { runId: 'r1', prompt: 'assign T-1041 to dana', tools: [], key: 'k' };
    for await (const event of agent.ask(request)) {
      if (event.type === EventType.TOOL_CALL_END) {
        agent.answer({ id: 'm1', role: 'tool', toolCallId: 'call_0', content: 'assigned' });
      }
    }
    for await (const event of agent.ask({ ...request, runId: 'r2', prompt: 'and T-1042' })) {
      if (event.type === EventType.TOOL_CALL_END) {
        break;
      }
    }

    for await (const event of agent.ask({ ...request, runId: 'r3', prompt: 'and now?' })) {
      void event;
    }

    expect(sent[3].messages.slice(-3).map((message) => [message['role'], message['tool_call_id'], message['content']])).toEqual([
      ['assistant', undefined, null],
      ['tool', 'call_0', 'the workbench did not answer this call.'],
      ['user', undefined, 'and now?'],
    ]);
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

  it('asks for the sentence about a model that is gone only when the answer says so', async () => {
    const asked: string[] = [];
    const wording: Wording = (key) => {
      asked.push(key);
      return key;
    };
    const limited: typeof fetch = () =>
      Promise.resolve(new Response(JSON.stringify({ error: { message: 'rate limited' } }), { status: 429 }));

    await run(limited, () => null, { wording });

    expect(asked).not.toContain('assistant.error.modelGone');
  });

  it('says each of its own failures in the language of the catalogue it was given', async () => {
    const answers = (body: string, status: number): typeof fetch => () =>
      Promise.resolve(new Response(body, { status }));
    const failures: { key: string; params?: Record<string, unknown>; fetchLike: typeof fetch; without?: boolean }[] = [
      { key: 'assistant.error.noKey', fetchLike: answers('{}', 200), without: true },
      { key: 'assistant.error.status', params: { status: 502 }, fetchLike: answers('{}', 502) },
      { key: 'assistant.error.noMessage', fetchLike: answers('{"choices":[]}', 200) },
      {
        key: 'assistant.error.timeout',
        params: { seconds: 60 },
        fetchLike: () => Promise.reject(new DOMException('timed out', 'TimeoutError')),
      },
    ];

    for (const catalogue of [en, de]) {
      const wording = wordingOf(catalogue);
      for (const failure of failures) {
        const seen = await run(failure.fetchLike, () => null, { wording, key: failure.without ? '' : 'k' });
        const message = seen[1].type === EventType.RUN_ERROR ? seen[1].message : '';

        expect(message).toBe(wording(failure.key, failure.params));
        expect(message).not.toContain(failure.key);
        expect(message).not.toMatch(/{{|undefined/);
      }
    }
    expect(wordingOf(de)('assistant.error.noKey')).not.toBe(wordingOf(en)('assistant.error.noKey'));
  });

  it('says where the model is set in the other language as well', async () => {
    const fetchLike: typeof fetch = () =>
      Promise.resolve(new Response(JSON.stringify({ error: { message: 'gone' } }), { status: 404 }));
    const seen = await run(fetchLike, () => null, { wording: wordingOf(de) });
    const message = seen[1].type === EventType.RUN_ERROR ? seen[1].message : '';

    expect(message).toBe(
      `gone ${wordingOf(de)('assistant.error.modelGone', { models: 'https://openrouter.ai/models?fmt=cards&supported_parameters=tools&max_price=0' })}`,
    );
    expect(message).not.toContain('Free models come and go');
  });

  it('carries no title beside the one its panel shows', () => {
    for (const catalogue of [en, de]) {
      expect(catalogue).not.toHaveProperty('title');
    }
  });
});

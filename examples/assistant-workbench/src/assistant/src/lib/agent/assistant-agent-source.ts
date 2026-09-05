import { EventType, type BaseEvent, type Tool, type ToolMessage } from '@ag-ui/core';

export const MODEL = 'minimax/minimax-m2.7:free';

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const MAX_ROUNDS = 8;
const TIMEOUT_MS = 60_000;
const INSTRUCTIONS =
  'You operate a support workbench for the person at the keyboard. Do what they ask by calling the tools; never describe a step you could take instead of taking it. When a ticket is named by its topic rather than its number, list the tickets first and pick the one that matches. When everything is done, answer in one or two short sentences saying what happened.';

export interface AgentRequest {
  readonly runId: string;
  readonly prompt: string;
  readonly tools: readonly Tool[];
  readonly key: string;
  readonly receive: (event: BaseEvent) => Promise<ToolMessage | null>;
}

export interface Agent {
  ask(request: AgentRequest): AsyncGenerator<BaseEvent>;
}

interface ChatToolCall {
  readonly id: string;
  readonly type: 'function';
  readonly function: { readonly name: string; readonly arguments: string };
}

interface ChatMessage {
  readonly role: 'system' | 'user' | 'assistant' | 'tool';
  readonly content: string | null;
  readonly tool_calls?: readonly ChatToolCall[];
  readonly tool_call_id?: string;
}

interface ChatCompletion {
  readonly choices?: readonly { readonly message: ChatMessage }[];
  readonly error?: { readonly message: string };
}

export function createAgent(fetchLike: typeof fetch = (input, init) => fetch(input, init)): Agent {
  const history: ChatMessage[] = [{ role: 'system', content: INSTRUCTIONS }];
  return { ask: (request) => ask(history, request, fetchLike) };
}

async function* ask(
  history: ChatMessage[],
  request: AgentRequest,
  fetchLike: typeof fetch,
): AsyncGenerator<BaseEvent> {
  const thread = { threadId: 'assistant', runId: request.runId };
  yield event(EventType.RUN_STARTED, thread);
  history.push({ role: 'user', content: request.prompt });
  try {
    for (let round = 0; round < MAX_ROUNDS; round++) {
      const message = await complete(fetchLike, request.key, history, request.tools);
      history.push(message);
      if (message.content) {
        yield* say(`${request.runId}.${round}`, message.content);
      }
      const calls = message.tool_calls ?? [];
      if (calls.length === 0) {
        break;
      }
      for (const call of calls) {
        const answer = yield* relay(call, request.receive);
        history.push({ role: 'tool', tool_call_id: call.id, content: answer.error ?? answer.content });
      }
    }
    yield event(EventType.RUN_FINISHED, thread);
  } catch (failure) {
    yield event(EventType.RUN_ERROR, { message: describe(failure) });
  }
}

async function* relay(
  call: ChatToolCall,
  receive: AgentRequest['receive'],
): AsyncGenerator<BaseEvent, ToolMessage> {
  const toolCallId = call.id;
  const start = event(EventType.TOOL_CALL_START, {
    toolCallId,
    toolCallName: commandId(call.function.name),
  });
  yield start;
  await receive(start);
  const args = event(EventType.TOOL_CALL_ARGS, {
    toolCallId,
    delta: call.function.arguments || '{}',
  });
  yield args;
  await receive(args);
  const end = event(EventType.TOOL_CALL_END, { toolCallId });
  yield end;
  const answer = (await receive(end)) ?? {
    id: `${toolCallId}.result`,
    role: 'tool',
    toolCallId,
    content: '',
    error: 'the workbench did not answer this call.',
  };
  yield event(EventType.TOOL_CALL_RESULT, {
    messageId: answer.id,
    toolCallId,
    content: answer.error ?? answer.content,
    role: 'tool',
  });
  return answer;
}

async function complete(
  fetchLike: typeof fetch,
  key: string,
  history: readonly ChatMessage[],
  tools: readonly Tool[],
): Promise<ChatMessage> {
  if (!key) {
    throw new Error('No OpenRouter key is set. Paste one in the panel first.');
  }
  const response = await fetchLike(ENDPOINT, {
    method: 'POST',
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://loomweaver.dev',
      'X-Title': 'Assistant Workbench',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: history,
      tools: tools.map(offered),
      tool_choice: 'auto',
    }),
  });
  const body = (await response.json()) as ChatCompletion;
  if (!response.ok || body.error) {
    throw new Error(body.error?.message ?? `OpenRouter answered with status ${response.status}.`);
  }
  const message = body.choices?.[0]?.message;
  if (!message) {
    throw new Error('OpenRouter answered without a message.');
  }
  return message;
}

function offered(tool: Tool) {
  return {
    type: 'function',
    function: {
      name: toolName(tool.name),
      description: tool.description,
      parameters: tool.parameters ?? { type: 'object', properties: {} },
    },
  };
}

async function* say(messageId: string, text: string): AsyncGenerator<BaseEvent> {
  yield event(EventType.TEXT_MESSAGE_START, { messageId, role: 'assistant' });
  yield event(EventType.TEXT_MESSAGE_CONTENT, { messageId, delta: text });
  yield event(EventType.TEXT_MESSAGE_END, { messageId });
}

function describe(failure: unknown): string {
  if (failure instanceof DOMException && failure.name === 'TimeoutError') {
    return `OpenRouter did not answer within ${TIMEOUT_MS / 1000} seconds. Free models are shared; try again.`;
  }
  return failure instanceof Error ? failure.message : String(failure);
}

function toolName(id: string): string {
  return id.replaceAll('.', '__');
}

function commandId(name: string): string {
  return name.replaceAll('__', '.');
}

function event(type: EventType, fields: Record<string, unknown>): BaseEvent {
  return { type, ...fields } as unknown as BaseEvent;
}

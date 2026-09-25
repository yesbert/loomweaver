import { EventType, type AGUIEvent, type Tool, type ToolMessage } from '@ag-ui/core';

export const MODEL = 'dots-studio/dots-3-note-preview:free';

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const MAX_ROUNDS = 8;
const TIMEOUT_MS = 60_000;
const FREE_MODELS = 'https://openrouter.ai/models?fmt=cards&supported_parameters=tools&max_price=0';
const GONE = `Free models come and go. Put another slug in MODEL in assistant-agent.ts; the free ones that can call tools are listed at ${FREE_MODELS}.`;
const INSTRUCTIONS =
  'You operate a support workbench for the person at the keyboard. Do what they ask by calling the tools; never describe a step you could take instead of taking it. When a ticket is named by its topic rather than its number, list the tickets first and pick the one that matches. When everything is done, answer in one or two short sentences saying what happened.';

export interface AgentRequest {
  readonly runId: string;
  readonly prompt: string;
  readonly tools: readonly Tool[];
  readonly key: string;
}

export interface Agent {
  ask(request: AgentRequest): AsyncGenerator<AGUIEvent>;
  answer(message: ToolMessage): void;
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
  const answers = new Map<string, ToolMessage>();
  return {
    ask: (request) => ask({ history, answers, fetchLike }, request),
    answer: (message) => {
      answers.set(message.toolCallId, message);
    },
  };
}

interface Conversation {
  readonly history: ChatMessage[];
  readonly answers: Map<string, ToolMessage>;
  readonly fetchLike: typeof fetch;
}

async function* ask(conversation: Conversation, request: AgentRequest): AsyncGenerator<AGUIEvent> {
  const { history, fetchLike } = conversation;
  const thread = { threadId: 'assistant', runId: request.runId };
  yield { type: EventType.RUN_STARTED, ...thread };
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
        yield* callEvents(call);
        const answer = answerTo(conversation.answers, call.id);
        history.push({ role: 'tool', tool_call_id: call.id, content: answer.error ?? answer.content });
      }
    }
    yield { type: EventType.RUN_FINISHED, ...thread };
  } catch (failure) {
    yield { type: EventType.RUN_ERROR, message: describe(failure) };
  }
}

async function* callEvents(call: ChatToolCall): AsyncGenerator<AGUIEvent> {
  const toolCallId = call.id;
  yield { type: EventType.TOOL_CALL_START, toolCallId, toolCallName: commandId(call.function.name) };
  yield { type: EventType.TOOL_CALL_ARGS, toolCallId, delta: call.function.arguments || '{}' };
  yield { type: EventType.TOOL_CALL_END, toolCallId };
}

function answerTo(answers: Map<string, ToolMessage>, toolCallId: string): ToolMessage {
  const answer = answers.get(toolCallId);
  answers.delete(toolCallId);
  return (
    answer ?? {
      id: `${toolCallId}.result`,
      role: 'tool',
      toolCallId,
      content: '',
      error: 'the workbench did not answer this call.',
    }
  );
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
    const said = body.error?.message ?? `OpenRouter answered with status ${response.status}.`;
    throw new Error(response.status === 404 ? `${said} ${GONE}` : said);
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

async function* say(messageId: string, text: string): AsyncGenerator<AGUIEvent> {
  yield { type: EventType.TEXT_MESSAGE_START, messageId, role: 'assistant' };
  yield { type: EventType.TEXT_MESSAGE_CONTENT, messageId, delta: text };
  yield { type: EventType.TEXT_MESSAGE_END, messageId };
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

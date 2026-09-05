import type { ResolvedWeaver } from './recipe';

export function standInFile(w: ResolvedWeaver): string {
  return `import { EventType, type BaseEvent, type Tool } from '@ag-ui/core';

// WHAT THIS IS: a stand-in for an agent, and not an agent. It speaks the AG-UI protocol and nothing
// else — no model, no network, no judgement — so that the whole path from the offered tools through
// a call to its outcome runs on the first serve, before you have connected anything.
//
// WHAT REPLACES IT: this file, and only this file. Point askAgent at your own endpoint and yield the
// events it streams back. The panel and the connection beside it stay exactly as they are.

const PACE = 40;

export interface AgentRequest {
  readonly runId: string;
  readonly prompt: string;
  /** What the workbench offers right now — the same list a real agent would be handed. */
  readonly tools: readonly Tool[];
}

export async function* askAgent(
  request: AgentRequest,
): AsyncGenerator<BaseEvent> {
  const picked = request.tools.find((tool) =>
    request.prompt.includes(tool.name),
  );

  yield event(EventType.RUN_STARTED, {
    threadId: '${w.id}-stand-in',
    runId: request.runId,
  });
  yield* speak(
    \`\${request.runId}.says\`,
    picked
      ? \`You asked for "\${request.prompt}". I can see \${request.tools.length} tool(s) and \${picked.name} is one of them, so I will call it.\`
      : \`You asked for "\${request.prompt}", and nothing among the \${request.tools.length} tool(s) I was offered matches it, so I will not call anything.\`,
  );

  if (picked) {
    const toolCallId = \`\${request.runId}.call\`;
    yield event(EventType.TOOL_CALL_START, {
      toolCallId,
      toolCallName: picked.name,
    });
    // Arguments arrive in pieces, exactly as they do from a real model. The adapter assembles them;
    // nothing downstream ever sees a half-written call. The values come from the JSON Schema the
    // workbench described in picked.parameters: the first declared choice of the first argument that
    // has choices, and nothing for the rest, so the command applies its own defaults there.
    for (const piece of chunks(JSON.stringify(sampleArguments(picked)), 4)) {
      yield event(EventType.TOOL_CALL_ARGS, { toolCallId, delta: piece });
      await pause();
    }
    yield event(EventType.TOOL_CALL_END, { toolCallId });
  }

  yield event(EventType.RUN_FINISHED, {
    threadId: '${w.id}-stand-in',
    runId: request.runId,
  });
}

async function* speak(
  messageId: string,
  text: string,
): AsyncGenerator<BaseEvent> {
  yield event(EventType.TEXT_MESSAGE_START, { messageId, role: 'assistant' });
  for (const piece of chunks(text, 10)) {
    yield event(EventType.TEXT_MESSAGE_CONTENT, { messageId, delta: piece });
    await pause();
  }
  yield event(EventType.TEXT_MESSAGE_END, { messageId });
}

function sampleArguments(tool: Tool): Record<string, unknown> {
  const schema = tool.parameters as
    | { properties?: Record<string, { enum?: readonly unknown[] }> }
    | undefined;
  for (const [name, property] of Object.entries(schema?.properties ?? {})) {
    if (property.enum && property.enum.length > 0) {
      return { [name]: property.enum[0] };
    }
  }
  return {};
}

function chunks(text: string, size: number): readonly string[] {
  const pieces: string[] = [];
  for (let at = 0; at < text.length; at += size) {
    pieces.push(text.slice(at, at + size));
  }
  return pieces;
}

function event(type: EventType, fields: Record<string, unknown>): BaseEvent {
  return { type, ...fields } as unknown as BaseEvent;
}

function pause(): Promise<void> {
  return new Promise((done) => setTimeout(done, PACE));
}
`;
}

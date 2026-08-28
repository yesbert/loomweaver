import { EventType, type BaseEvent } from '@ag-ui/core';
import type { Beat } from './agent-script';

const THREAD_ID = 'demo-thread';
const TEXT_CHUNK = 12;
const ARGUMENT_CHUNK = 9;

function event(type: EventType, fields: Record<string, unknown>): BaseEvent {
  return { type, ...fields } as unknown as BaseEvent;
}

function chunks(text: string, size: number): readonly string[] {
  const pieces: string[] = [];
  for (let at = 0; at < text.length; at += size) {
    pieces.push(text.slice(at, at + size));
  }
  return pieces;
}

function* speak(messageId: string, text: string): Generator<BaseEvent> {
  yield event(EventType.TEXT_MESSAGE_START, { messageId, role: 'assistant' });
  for (const piece of chunks(text, TEXT_CHUNK)) {
    yield event(EventType.TEXT_MESSAGE_CONTENT, { messageId, delta: piece });
  }
  yield event(EventType.TEXT_MESSAGE_END, { messageId });
}

export function* asking(
  beat: Beat,
  runId: string,
  says: string,
): Generator<BaseEvent> {
  const toolCallId = `${runId}.call`;

  yield event(EventType.RUN_STARTED, { threadId: THREAD_ID, runId });
  yield* speak(`${runId}.says`, says);
  yield event(EventType.TOOL_CALL_START, {
    toolCallId,
    toolCallName: beat.call.commandId,
  });
  for (const piece of chunks(JSON.stringify(beat.call.args()), ARGUMENT_CHUNK)) {
    yield event(EventType.TOOL_CALL_ARGS, { toolCallId, delta: piece });
  }
  yield event(EventType.TOOL_CALL_END, { toolCallId });
  yield event(EventType.RUN_FINISHED, { threadId: THREAD_ID, runId });
}

export function* answering(runId: string, closes: string): Generator<BaseEvent> {
  yield event(EventType.RUN_STARTED, { threadId: THREAD_ID, runId });
  yield* speak(`${runId}.closes`, closes);
  yield event(EventType.RUN_FINISHED, { threadId: THREAD_ID, runId });
}

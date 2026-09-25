import { EventType, type AGUIEvent } from '@ag-ui/core';
import type { Beat } from './beats';

const THREAD_ID = 'demo-thread';
const TEXT_CHUNK = 12;
const ARGUMENT_CHUNK = 9;

function chunks(text: string, size: number): readonly string[] {
  const pieces: string[] = [];
  for (let at = 0; at < text.length; at += size) {
    pieces.push(text.slice(at, at + size));
  }
  return pieces;
}

function* speak(messageId: string, text: string): Generator<AGUIEvent> {
  yield { type: EventType.TEXT_MESSAGE_START, messageId, role: 'assistant' };
  for (const piece of chunks(text, TEXT_CHUNK)) {
    yield { type: EventType.TEXT_MESSAGE_CONTENT, messageId, delta: piece };
  }
  yield { type: EventType.TEXT_MESSAGE_END, messageId };
}

export function* asking(
  beat: Beat,
  runId: string,
  says: string,
): Generator<AGUIEvent> {
  const toolCallId = `${runId}.call`;

  yield { type: EventType.RUN_STARTED, threadId: THREAD_ID, runId };
  yield* speak(`${runId}.says`, says);
  yield { type: EventType.TOOL_CALL_START, toolCallId, toolCallName: beat.call.commandId };
  for (const piece of chunks(JSON.stringify(beat.call.args()), ARGUMENT_CHUNK)) {
    yield { type: EventType.TOOL_CALL_ARGS, toolCallId, delta: piece };
  }
  yield { type: EventType.TOOL_CALL_END, toolCallId };
  yield { type: EventType.RUN_FINISHED, threadId: THREAD_ID, runId };
}

export function* answering(runId: string, closes: string): Generator<AGUIEvent> {
  yield { type: EventType.RUN_STARTED, threadId: THREAD_ID, runId };
  yield* speak(`${runId}.closes`, closes);
  yield { type: EventType.RUN_FINISHED, threadId: THREAD_ID, runId };
}

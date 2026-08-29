import type { ToolMessage } from '@ag-ui/core';
import type { CommandOutcome } from '@loomweaver/plugin-sdk';

const RAN = 'The command ran.';

/**
 * Turns what the workbench answered into the message that goes back to the agent.
 *
 * A refusal and a failure both land in `error`, because the protocol has one field for "this did not
 * give you an answer" and its own reason for having it: without it, a tool that failed cannot be told
 * from one that succeeded. The wording keeps the distinction the workbench preserved, so an agent
 * reading it can tell "it did not run" from "it ran and broke" and choose differently.
 *
 * A command that declares no answer reports plainly that it ran. An empty string would read to an
 * agent like a tool that returned nothing useful, and the usual response to that is to try again.
 */
export function resultFor(
  toolCallId: string,
  outcome: CommandOutcome,
): ToolMessage {
  if (outcome.outcome === 'answered') {
    return message(toolCallId, contentOf(outcome.value));
  }
  if (outcome.outcome === 'refused') {
    return message(
      toolCallId,
      '',
      `The command did not run: ${outcome.message}`,
    );
  }
  return message(toolCallId, '', `The command ran and failed: ${outcome.message}`);
}

/** The message that answers a call the adapter could not put to the workbench at all. */
export function refusalFor(toolCallId: string, reason: string): ToolMessage {
  return message(toolCallId, '', `The command did not run: ${reason}`);
}

/** The message that answers a call something in front of the workbench answered itself. */
export function answerFor(toolCallId: string, content: string): ToolMessage {
  return message(toolCallId, content);
}

function contentOf(value: unknown): string {
  if (value === undefined) {
    return RAN;
  }
  return typeof value === 'string' ? value : JSON.stringify(value);
}

function message(
  toolCallId: string,
  content: string,
  error?: string,
): ToolMessage {
  return {
    id: `tool-${toolCallId}`,
    role: 'tool',
    toolCallId,
    content,
    ...(error !== undefined && { error }),
  };
}

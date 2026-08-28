import { EventType, type BaseEvent, type Tool, type ToolMessage } from '@ag-ui/core';
import type { CommandArguments, PluginContext } from '@loomweaver/plugin-sdk';
import { readArguments } from './tool-arguments.js';
import { toolsFor } from './tool-definitions.js';
import { answerFor, refusalFor, resultFor } from './tool-results.js';

/**
 * The slice of a plugin context this adapter touches: what may be run, and running it. Narrower than
 * the whole context on purpose — it says exactly what an agent reaches through here, and a plugin
 * hands its `ctx` straight in.
 */
export type CommandAccess = Pick<
  PluginContext,
  'invocableCommands' | 'invokeCommand'
>;

/** One call an agent asked for, assembled from however many events carried it. */
export interface PendingToolCall {
  /** The protocol's id for this call — what the answer is addressed to. */
  readonly toolCallId: string;
  /** The command the agent named. */
  readonly commandId: string;
  /** What it wants to pass, already readable as data but not yet checked against the command. */
  readonly args: CommandArguments;
}

/**
 * What a weaver decides about a call before it runs. `run` lets it through to the workbench,
 * `decline` answers the agent that it did not run and why, and `answer` serves the call without the
 * workbench being involved.
 *
 * A decision can only narrow. Letting a call through does not make it reachable: the workbench
 * refuses what it always refused, whatever was decided here.
 */
export type ToolDecision =
  | { readonly decision: 'run' }
  | { readonly decision: 'decline'; readonly reason: string }
  | { readonly decision: 'answer'; readonly content: string };

/** What a weaver may supply when it wants a say before a call runs. */
export interface CommandToolOptions {
  before?(call: PendingToolCall): ToolDecision | Promise<ToolDecision>;
}

/**
 * The workbench's own actions, offered to an agent and run on its behalf.
 *
 * Hand every event of a run to {@link receive} and send back whatever it answers. Ask {@link list}
 * for the tools when a run begins rather than keeping the answer: what a plugin may reach changes as
 * plugins load and the session changes, and a list kept from earlier promises actions that are no
 * longer there.
 */
export interface CommandTools {
  /** The tools reachable right now, from the workbench's own already-narrowed account. */
  list(): readonly Tool[];
  /**
   * Takes one event of the run. Answers the message to send back where the event completed a call,
   * and nothing otherwise. Events that are not part of a tool call are ignored.
   */
  receive(event: BaseEvent): Promise<ToolMessage | null>;
  /**
   * Closes a call the agent left open, answering it if there was one. A run that ends without its
   * closing event is the case this exists for; {@link receive} already does it when the run reports
   * that it finished.
   */
  flush(): Promise<ToolMessage | null>;
}

interface OpenCall {
  readonly toolCallId: string;
  readonly commandId: string;
  json: string;
}

function textOf(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/**
 * Connects a plugin context to an agent's tool calls.
 *
 * The commands the workbench offers become the tools, and a call comes back through the same seam
 * every other trigger runs through — so an agent reaches what the user could have reached, and
 * nothing more. Nothing here opens a connection, renders anything or decides what to do; a weaver
 * brings the stream and this carries what it says.
 */
export function commandTools(
  ctx: CommandAccess,
  options: CommandToolOptions = {},
): CommandTools {
  const open = new Map<string, OpenCall>();
  let chunked: string | null = null;

  const finish = async (call: OpenCall): Promise<ToolMessage> => {
    open.delete(call.toolCallId);
    if (chunked === call.toolCallId) {
      chunked = null;
    }
    const args = readArguments(call.json);
    if (args === null) {
      return refusalFor(
        call.toolCallId,
        'its arguments did not arrive as readable JSON.',
      );
    }
    const decision = await decide(options, {
      toolCallId: call.toolCallId,
      commandId: call.commandId,
      args,
    });
    if (decision.decision === 'decline') {
      return refusalFor(call.toolCallId, decision.reason);
    }
    if (decision.decision === 'answer') {
      return answerFor(call.toolCallId, decision.content);
    }
    return resultFor(
      call.toolCallId,
      await ctx.invokeCommand(call.commandId, args),
    );
  };

  const flush = async (): Promise<ToolMessage | null> => {
    const pending = [...open.values()];
    open.clear();
    chunked = null;
    const last = pending.pop();
    return last === undefined ? null : finish(last);
  };

  return {
    list: () => toolsFor(ctx.invocableCommands()),
    flush,
    receive: async (event) => {
      const raw = event as Record<string, unknown>;
      switch (event.type) {
        case EventType.TOOL_CALL_START:
          open.set(String(raw['toolCallId']), {
            toolCallId: String(raw['toolCallId']),
            commandId: String(raw['toolCallName']),
            json: '',
          });
          return null;
        case EventType.TOOL_CALL_ARGS: {
          const call = open.get(String(raw['toolCallId']));
          if (call) {
            call.json += textOf(raw['delta']);
          }
          return null;
        }
        case EventType.TOOL_CALL_END: {
          const call = open.get(String(raw['toolCallId']));
          return call ? finish(call) : null;
        }
        case EventType.TOOL_CALL_CHUNK:
          return receiveChunk(raw);
        case EventType.RUN_FINISHED:
        case EventType.RUN_ERROR:
          return flush();
        default:
          return null;
      }
    },
  };

  async function receiveChunk(
    raw: Record<string, unknown>,
  ): Promise<ToolMessage | null> {
    const id = raw['toolCallId'];
    if (typeof id === 'string' && id !== chunked) {
      const previous = chunked === null ? null : open.get(chunked);
      chunked = id;
      open.set(id, {
        toolCallId: id,
        commandId: textOf(raw['toolCallName']),
        json: textOf(raw['delta']),
      });
      return previous ? finish(previous) : null;
    }
    const call = chunked === null ? undefined : open.get(chunked);
    if (call) {
      call.json += textOf(raw['delta']);
    }
    return null;
  }
}

async function decide(
  options: CommandToolOptions,
  call: PendingToolCall,
): Promise<ToolDecision> {
  return options.before ? options.before(call) : { decision: 'run' };
}

import {
  EventType,
  type AGUIEvent,
  type BaseEvent,
  type Tool,
  type ToolMessage,
} from '@ag-ui/core';
import type {
  AgentConsent,
  CommandArguments,
  PluginContext,
} from '@loomweaver/plugin-sdk';
import { type AssembledCall, ToolCallAssembly } from './tool-call-assembly.js';
import { readArguments } from './tool-arguments.js';
import { offeredCommand, toolsFor } from './tool-definitions.js';
import { answerFor, refusalFor, resultFor } from './tool-results.js';

/**
 * The part of a plugin context this adapter uses: what may be run, and running it. Narrower than
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
  /** The command the call runs, as the workbench knows it (not the tool name the agent used). */
  readonly commandId: string;
  /** What it wants to pass, already readable as data but not yet checked against the command. */
  readonly args: CommandArguments;
  /**
   * How much an agent may do with the named command without asking the user, read at the moment of
   * the call rather than from a list kept earlier.
   *
   * Undefined where the command says nothing. A call reaches this hook only for a command offered as
   * a tool at that moment, so a command its plugin did not open to callers never gets here: the
   * connection refuses it, as the workbench refuses it for every other caller.
   *
   * Nothing here acts on it. Asking, and remembering an answer, are the plugin's, which is what this
   * hook is for; the adapter only makes sure the statement is at hand where the decision is taken.
   */
  readonly agentConsent?: AgentConsent;
}

/**
 * What a plugin decides about a call before it runs. `run` lets it through to the workbench,
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

/**
 * What a plugin may supply when it wants a say before a call runs. A hook that throws, rejects or
 * answers with no decision it could have given has not let the call through: the call is refused,
 * its command does not run, and the run carries on with the next event. What went wrong is written
 * to the console and not told to the agent, because an error's message was not written for it.
 */
export interface CommandToolOptions {
  before?(call: PendingToolCall): ToolDecision | Promise<ToolDecision>;
}

/**
 * The workbench's own actions, offered to an agent and run on its behalf. One connection follows
 * one run at a time: give each conversation that may run beside another a connection of its own.
 *
 * Hand every event of a run to {@link receive} and send back whatever it answers. Ask {@link list}
 * for the tools when a run begins rather than keeping the answer: what a plugin may reach changes as
 * plugins load and the session changes, and a list kept from earlier promises actions that are no
 * longer there.
 */
export interface CommandTools {
  /** The tools this plugin may reach right now, as the workbench offers them. */
  list(): readonly Tool[];
  /**
   * Takes one event of the run. Answers the message to send back where the event completed a call,
   * and nothing otherwise. Events that are not part of a tool call are ignored. The event that ends
   * the run answers the first call still open; ask {@link flush} for the rest. The event that starts
   * a run forgets every call an earlier run left open, so a call from a run that broke off without
   * its last event is neither run nor answered in the next one.
   */
  receive(event: BaseEvent): Promise<ToolMessage | null>;
  /**
   * Answers one call the agent left open, or nothing once none is left, so call it until it answers
   * nothing when the run is over. A call left open never received all of its arguments, so it is
   * refused, saying why, and its command does not run. Only the call carried by chunks is closed by
   * a run that finished, as the protocol defines, and runs.
   *
   * Ask it where the run broke off too, when the stream threw or was cancelled before its last
   * event: no event answers those calls, and the next run forgets them.
   */
  flush(): Promise<ToolMessage | null>;
}

const UNREADABLE = 'its arguments did not arrive as readable JSON.';
const NOT_OFFERED = 'it is not one of the tools offered to you.';
const UNFINISHED = 'the run ended before its arguments were complete.';
const UNDECIDED = 'the check in front of it failed.';

/**
 * Connects a plugin context to an agent's tool calls.
 *
 * The commands the workbench offers become the tools, and a call comes back the same way every other
 * trigger runs — so an agent reaches what the user could have reached, and nothing more. Nothing
 * here opens a connection, renders anything or decides what to do; a plugin brings the stream and
 * this carries what it says.
 */
export function commandTools(
  ctx: CommandAccess,
  options: CommandToolOptions = {},
): CommandTools {
  const assembly = new ToolCallAssembly();

  const answer = async (
    call: AssembledCall | undefined,
  ): Promise<ToolMessage | null> =>
    call ? answerCall(ctx, options, call) : null;

  const flush = async (): Promise<ToolMessage | null> => {
    const left = assembly.takeFirst();
    return left ? refusalFor(left.toolCallId, UNFINISHED) : null;
  };

  return {
    list: () => toolsFor(ctx.invocableCommands()),
    flush,
    receive: async (received) => {
      const event = received as AGUIEvent;
      switch (event.type) {
        case EventType.RUN_STARTED: {
          assembly.clear();
          return null;
        }
        case EventType.TOOL_CALL_START: {
          assembly.start(event.toolCallId, event.toolCallName);
          return null;
        }
        case EventType.TOOL_CALL_ARGS: {
          assembly.append(event.toolCallId, event.delta);
          return null;
        }
        case EventType.TOOL_CALL_END: {
          return answer(assembly.take(event.toolCallId));
        }
        case EventType.TOOL_CALL_CHUNK: {
          return answer(
            assembly.chunk(
              event.toolCallId,
              event.toolCallName ?? '',
              event.delta ?? '',
            ),
          );
        }
        case EventType.RUN_FINISHED: {
          const carried = assembly.takeChunked();
          return carried ? answerCall(ctx, options, carried) : flush();
        }
        case EventType.RUN_ERROR: {
          return flush();
        }
        default: {
          return null;
        }
      }
    },
  };
}

async function answerCall(
  ctx: CommandAccess,
  options: CommandToolOptions,
  call: AssembledCall,
): Promise<ToolMessage> {
  const command = offeredCommand(ctx.invocableCommands(), call.toolName);
  if (!command) {
    return refusalFor(call.toolCallId, NOT_OFFERED);
  }
  const args = readArguments(call.json);
  if (args === null) {
    return refusalFor(call.toolCallId, UNREADABLE);
  }
  const decision = await decisionOf(options, {
    toolCallId: call.toolCallId,
    commandId: command.id,
    args,
    ...(command.agentConsent !== undefined && { agentConsent: command.agentConsent }),
  });
  switch (decision?.decision) {
    case 'run': {
      return run(ctx, call.toolCallId, command.id, args);
    }
    case 'decline': {
      return refusalFor(call.toolCallId, decision.reason);
    }
    case 'answer': {
      return answerFor(call.toolCallId, decision.content);
    }
    default: {
      return refusalFor(call.toolCallId, UNDECIDED);
    }
  }
}

async function decisionOf(
  options: CommandToolOptions,
  call: PendingToolCall,
): Promise<ToolDecision | undefined> {
  if (!options.before) {
    return { decision: 'run' };
  }
  try {
    return await options.before(call);
  } catch (error) {
    console.error(
      `The check in front of the tool call for "${call.commandId}" failed, so the call is refused.`,
      error,
    );
    return undefined;
  }
}

async function run(
  ctx: CommandAccess,
  toolCallId: string,
  commandId: string,
  args: CommandArguments,
): Promise<ToolMessage> {
  return resultFor(toolCallId, await ctx.invokeCommand(commandId, args));
}

import { CommandAnswer, CommandArgument } from './command-arguments.js';
import { AgentConsent } from './command.js';

/**
 * Why an invocation was refused. A refusal is not a failure: the command did not run.
 *
 * `unavailable` is deliberately one answer for several situations — no such command, not open to a
 * foreign caller, the session does not meet its access requirement, the window does not host it, the
 * calling plugin was not granted the capability. Telling them apart would let a caller map what is
 * installed by invoking ids and reading the reason back.
 */
export type CommandRefusalReason =
  | 'unavailable'
  | 'invalid-arguments'
  | 'too-deep';

/** The command ran; `value` is present where the command declares {@link Command.answers}. */
export interface CommandAnswered {
  readonly outcome: 'answered';
  readonly value?: CommandAnswer;
}

/** The command did not run. */
export interface CommandRefused {
  readonly outcome: 'refused';
  readonly reason: CommandRefusalReason;
  /** A developer-facing explanation; never the place to show a user a message. */
  readonly message: string;
}

/** The command ran and threw, or its asynchronous work rejected. */
export interface CommandFailed {
  readonly outcome: 'failed';
  readonly message: string;
}

/**
 * What an invocation answers with. The three cases are distinct because a caller has to tell
 * "you may not" from "it broke" from "here is your answer", and none of the three may be presented
 * as either of the others.
 */
export type CommandOutcome = CommandAnswered | CommandRefused | CommandFailed;

/**
 * A command as offered to a caller that may invoke it. Every text is already resolved to the active
 * language, because a caller outside the application cannot reach the translation bundles.
 */
export interface InvocableCommand {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly arguments?: readonly CommandArgument[];
  readonly answers?: string;
  /** What the command says an agent's word is enough for — see {@link Command.agentConsent}. */
  readonly agentConsent?: AgentConsent;
}

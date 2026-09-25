import { ErrorHandler, inject, Service } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import {
  CapabilityError,
  Command,
  CommandArguments,
  CommandOutcome,
  InvocableCommand,
} from '@loomweaver/plugin-sdk';
import {
  ContributionRegistry,
  RegisteredCommand,
} from '../contributions/contribution-registry';
import { CommandService } from './command.service';
import {
  argumentProblem,
  isCommandAnswer,
} from '../foundation/command-arguments';
import { CommandInvoker } from '../foundation/command-invoker';

const MAX_INVOCATION_DEPTH = 16;

const UNAVAILABLE: CommandOutcome = {
  outcome: 'refused',
  reason: 'unavailable',
  message:
    'No command with that id is available to this caller here and now. It may not exist, it may ' +
    'not be open to a caller other than its own plugin, the session may not meet its access ' +
    'requirement, this window may not host it, or the caller may lack the automation capability.',
};

interface Caller {
  readonly id: string;
  readonly mayAutomate: boolean;
}

function isOwnCommand(
  entry: RegisteredCommand | undefined,
  caller: Caller,
): boolean {
  return entry?.ownerId !== undefined && entry.ownerId === caller.id;
}

@Service()
export class CommandInvocationService implements CommandInvoker {
  private readonly commands = inject(CommandService);
  private readonly registry = inject(ContributionRegistry);
  private readonly errors = inject(ErrorHandler);
  private readonly transloco = inject(TranslocoService, { optional: true });

  private depth = 0;

  invocable(callerId: string, granted: boolean): readonly InvocableCommand[] {
    const caller: Caller = { id: callerId, mayAutomate: granted };
    return this.registry
      .registeredCommands()
      .filter(
        (entry) =>
          entry.command.callable === true && this.reachable(entry, caller),
      )
      .map((entry) => this.describe(entry.command))
      .toSorted((a, b) => a.id.localeCompare(b.id));
  }

  async invoke(
    callerId: string,
    granted: boolean,
    id: string,
    args?: CommandArguments,
  ): Promise<CommandOutcome> {
    const caller: Caller = { id: callerId, mayAutomate: granted };
    const entry = this.registry
      .registeredCommands()
      .find((candidate) => candidate.command.id === id);
    if (entry === undefined || !this.reachable(entry, caller)) {
      this.reportRefusal(caller, entry);
      return UNAVAILABLE;
    }
    const command = entry.command;
    const problem = argumentProblem(command.arguments, args);
    if (problem !== null) {
      return {
        outcome: 'refused',
        reason: 'invalid-arguments',
        message: `Command "${id}" ${problem}.`,
      };
    }
    if (this.depth >= MAX_INVOCATION_DEPTH) {
      return {
        outcome: 'refused',
        reason: 'too-deep',
        message:
          `Command "${id}" was refused: invocations are nested more than ` +
          `${MAX_INVOCATION_DEPTH} deep, which is a loop rather than a chain.`,
      };
    }
    return this.run(command, args);
  }

  private async run(
    command: Command,
    args: CommandArguments | undefined,
  ): Promise<CommandOutcome> {
    this.depth += 1;
    try {
      const returned = await this.commands.run(command, undefined, args);
      return this.answerOf(command, returned);
    } catch (error) {
      return { outcome: 'failed', message: messageOf(error) };
    } finally {
      this.depth -= 1;
    }
  }

  private answerOf(command: Command, returned: unknown): CommandOutcome {
    if (command.answers === undefined) {
      return { outcome: 'answered' };
    }
    if (!isCommandAnswer(returned)) {
      return {
        outcome: 'failed',
        message:
          `Command "${command.id}" declares an answer but returned something that cannot be ` +
          `carried as data, so nothing was handed back.`,
      };
    }
    return { outcome: 'answered', value: returned };
  }

  private reachable(entry: RegisteredCommand, caller: Caller): boolean {
    const opened = caller.mayAutomate && entry.command.callable === true;
    if (!isOwnCommand(entry, caller) && !opened) {
      return false;
    }
    return this.commands.available(entry.command);
  }

  private reportRefusal(
    caller: Caller,
    entry: RegisteredCommand | undefined,
  ): void {
    if (caller.mayAutomate || isOwnCommand(entry, caller)) {
      return;
    }
    this.errors.handleError(
      new CapabilityError(
        'automation',
        caller.id,
        'Running an action another plugin contributed needs the automation capability.',
      ),
    );
  }

  private describe(command: Command): InvocableCommand {
    return {
      id: command.id,
      title: this.text(command.title),
      description:
        command.description === undefined
          ? undefined
          : this.text(command.description),
      arguments: command.arguments?.map((argument) => ({
        ...argument,
        description: this.text(argument.description),
      })),
      answers:
        command.answers === undefined ? undefined : this.text(command.answers),
      agentConsent: command.agentConsent,
    };
  }

  private text(value: string): string {
    return this.transloco?.translate(value) ?? value;
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

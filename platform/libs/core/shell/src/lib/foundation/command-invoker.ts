import { InjectionToken } from '@angular/core';
import {
  CommandArguments,
  CommandOutcome,
  InvocableCommand,
} from '@loomweaver/plugin-sdk';

export interface CommandInvoker {
  invocable(callerId: string, granted: boolean): readonly InvocableCommand[];
  invoke(
    callerId: string,
    granted: boolean,
    id: string,
    args?: CommandArguments,
  ): Promise<CommandOutcome>;
}

const NOT_COMPOSED: CommandInvoker = {
  invocable: () => [],
  invoke: () =>
    Promise.resolve({
      outcome: 'refused',
      reason: 'unavailable',
      message:
        'Nothing has composed the command seam in this injector, so no command can be reached ' +
        'through it. A distribution gets it from provideShell().',
    }),
};

export const COMMAND_INVOKER = new InjectionToken<CommandInvoker>(
  'lw.command-invoker',
  {
    providedIn: 'root',
    factory: () => NOT_COMPOSED,
  },
);

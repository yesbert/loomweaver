import type {
  ChoiceCommandArgument,
  Command,
  PluginContext,
} from '@loomweaver/plugin-sdk';
import { addQuote, resetQuotes } from '../accounting';
import { registerQuoteCommands } from './quotes-commands';

function registeredCommands(): Command[] {
  const commands: Command[] = [];
  const ctx = {
    registerCommand: (command: Command) => {
      commands.push(command);
      return { dispose: () => undefined };
    },
  } as unknown as PluginContext;
  registerQuoteCommands(ctx);
  return commands;
}

function numberChoices(commands: readonly Command[], id: string): readonly string[] {
  const command = commands.find((candidate) => candidate.id === id);
  return (command?.arguments?.[0] as ChoiceCommandArgument).choices;
}

describe('the quote commands', () => {
  afterEach(() => resetQuotes());

  it('accept a quote created after they were registered', () => {
    const commands = registeredCommands();

    const created = addQuote('c-nordwind');

    for (const id of ['quotes.open', 'quotes.send', 'quotes.margin']) {
      expect(numberChoices(commands, id)).toContain(created.number);
    }
  });
});

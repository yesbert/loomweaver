import type { Command, PluginContext } from '@loomweaver/plugin-sdk';
import { ticketsPlugin } from './tickets.plugin';

function registeredCommands(): Command[] {
  const commands: Command[] = [];
  const ctx = {
    contributeIcons: () => undefined,
    registerSurface: () => undefined,
    registerCommand: (command: Command) => {
      commands.push(command);
    },
  } as unknown as PluginContext;
  ticketsPlugin.activate?.(ctx);
  ticketsPlugin.deactivate?.();
  return commands;
}

describe('ticketsPlugin', () => {
  it('declares its manifest', () => {
    expect(ticketsPlugin.manifest.id).toBe('tickets');
    expect(ticketsPlugin.manifest.capabilities).toContain('contributions');
  });

  it('offers in the search only the command that runs without a ticket number', () => {
    const offered = registeredCommands()
      .filter((command) => !command.paletteHidden)
      .map((command) => command.id);

    expect(offered).toEqual(['tickets.list']);
  });
});

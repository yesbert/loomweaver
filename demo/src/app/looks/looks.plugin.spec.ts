import type { Command, PluginContext } from '@loomweaver/plugin-sdk';
import { looksPlugin } from './looks.plugin';

describe('the looks plugin', () => {
  it('keeps the switch out of the search, which cannot say which look is wanted', () => {
    const commands: Command[] = [];
    const ctx = {
      registerCommand: (command: Command) => {
        commands.push(command);
      },
    } as unknown as PluginContext;

    looksPlugin.activate?.(ctx);

    expect(commands.map((command) => command.paletteHidden)).toEqual([true]);
  });
});

import type { Command, Plugin, PluginContext } from '@loomweaver/plugin-sdk';
import { insightsPlugin } from '../insights/insights.plugin';
import { looksPlugin } from '../looks/looks.plugin';
import { quotesPlugin } from '../quotes/src';
import { agentPlugin } from './agent.plugin';
import { BEATS } from './agent-script';

interface Recorded {
  readonly icons: string[];
  readonly surfaces: { id: string; docks?: readonly string[] }[];
  readonly commands: string[];
}

function activate(plugin: Plugin): Recorded {
  const recorded: Recorded = { icons: [], surfaces: [], commands: [] };
  const ctx = {
    bind: () => undefined,
    contributeIcons: (icons: Record<string, string>) =>
      recorded.icons.push(...Object.keys(icons)),
    registerSurface: (surface: { id: string; docks?: readonly string[] }) =>
      recorded.surfaces.push({ id: surface.id, docks: surface.docks }),
    registerCommand: (command: Command) => recorded.commands.push(command.id),
    openContentTab: () => undefined,
    keepContentTab: () => undefined,
    navigateContent: () => undefined,
    invocableCommands: () => [],
    invokeCommand: async () => ({ outcome: 'answered', value: '' }),
  } as unknown as PluginContext;

  plugin.activate(ctx);
  return recorded;
}

describe('agentPlugin', () => {
  it('declares only the capabilities it uses', () => {
    expect(agentPlugin.manifest.id).toBe('agent');
    expect([...(agentPlugin.manifest.capabilities ?? [])].sort()).toEqual([
      'automation',
      'contributions',
      'ui',
    ]);
  });

  it('docks the chat beside the work rather than over it, naming the region because a wrong one renders nothing', () => {
    const recorded = activate(agentPlugin);

    expect(recorded.surfaces).toEqual([
      { id: 'agent.chat', docks: ['right-panel'] },
    ]);
    expect(recorded.icons).toContain('agent');
  });

  it('drives only commands the demo actually contributes, so a renamed command fails here rather than in front of a visitor', () => {
    const contributed = [quotesPlugin, insightsPlugin, looksPlugin].flatMap(
      (plugin) => activate(plugin).commands,
    );

    for (const beat of BEATS) {
      expect(contributed).toContain(beat.call.commandId);
    }
  });

  it('keeps the beat that reloads the page last, and warns on that one alone', () => {
    const warning = BEATS.filter((beat) => beat.warnsBeforeCalling).map((beat) => beat.id);

    expect(warning).toEqual(['look']);
    expect(BEATS[BEATS.length - 1].id).toBe('look');
  });
});

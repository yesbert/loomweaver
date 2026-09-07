import type { PluginContext } from '@loomweaver/plugin-sdk';
import { aboutPlugin } from './about.plugin';

interface Recorded {
  readonly commands: string[];
  readonly sections: { id: string; kinds: string[] }[];
  readonly opened: string[];
  readonly written: unknown[];
}

function activateWith(stored: boolean | undefined, loaded = true): Recorded {
  const recorded: Recorded = { commands: [], sections: [], opened: [], written: [] };
  const ctx = {
    registerCommand: (command: { id: string }) => recorded.commands.push(command.id),
    registerSettingsSection: (section: {
      id: string;
      rows: readonly { control: { kind: string } }[];
    }) =>
      recorded.sections.push({
        id: section.id,
        kinds: section.rows.map((row) => row.control.kind),
      }),
    ui: {
      open: (_component: unknown, options?: { title?: string }) =>
        recorded.opened.push(options?.title ?? ''),
    },
    state: {
      watch: () => ({
        value: () => stored,
        loaded: () => loaded,
        set: (next: unknown) => recorded.written.push(next),
        clear: () => undefined,
        dispose: () => undefined,
      }),
    },
  } as unknown as PluginContext;
  aboutPlugin.activate(ctx);
  return recorded;
}

describe('aboutPlugin', () => {
  it('declares only the capabilities it uses', () => {
    expect(aboutPlugin.manifest.id).toBe('about');
    expect([...(aboutPlugin.manifest.capabilities ?? [])].sort()).toEqual(['contributions', 'ui']);
  });

  it('offers the About command and the About settings section', () => {
    const recorded = activateWith(true);

    expect(recorded.commands).toEqual(['demo.about']);
    expect(recorded.sections).toEqual([{ id: 'demo.about', kinds: ['component'] }]);
  });

  it('welcomes a first visit once and remembers it', () => {
    const recorded = activateWith(undefined);

    expect(recorded.opened).toEqual(['product.about.welcome']);
    expect(recorded.written).toEqual([true]);
  });

  it('does not welcome a visitor it has welcomed before', () => {
    const recorded = activateWith(true);

    expect(recorded.opened).toEqual([]);
    expect(recorded.written).toEqual([]);
  });

  it('does not guess while the store has not answered', () => {
    const recorded = activateWith(undefined, false);

    expect(recorded.opened).toEqual([]);
    expect(recorded.written).toEqual([]);
  });
});

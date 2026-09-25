import type { PluginContext } from '@loomweaver/plugin-sdk';
import { aboutPlugin } from './about.plugin';

type Listener = (value: boolean | undefined, loaded: boolean) => void;

interface Recorded {
  readonly commands: string[];
  readonly sections: { id: string; kinds: string[] }[];
  readonly opened: string[];
  readonly written: unknown[];
  readonly answer: (value: boolean | undefined) => void;
}

function activateWith(stored: boolean | undefined, loaded = true): Recorded {
  let listeners: Listener[] = [];
  const recorded: Recorded = {
    commands: [],
    sections: [],
    opened: [],
    written: [],
    answer: (value) => {
      for (const listener of listeners) {
        listener(value, true);
      }
    },
  };
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
        dispose: () => {
          listeners = [];
        },
        onChange: (listener: Listener) => {
          listeners.push(listener);
          if (loaded) {
            listener(stored, true);
          }
        },
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

    expect(recorded.commands).toEqual(['about.show']);
    expect(recorded.sections).toEqual([{ id: 'about.settings', kinds: ['component'] }]);
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

  it('welcomes a first visit once a store that answers later has answered', () => {
    const recorded = activateWith(undefined, false);

    recorded.answer(undefined);

    expect(recorded.opened).toEqual(['product.about.welcome']);
    expect(recorded.written).toEqual([true]);
  });

  it('does not welcome a visitor it has welcomed before when the store answers later', () => {
    const recorded = activateWith(undefined, false);

    recorded.answer(true);
    recorded.answer(undefined);

    expect(recorded.opened).toEqual([]);
    expect(recorded.written).toEqual([]);
  });
});

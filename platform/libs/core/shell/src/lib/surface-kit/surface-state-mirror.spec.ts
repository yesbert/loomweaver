import { createState } from './surface-state-mirror';
import type { LwStateHost } from './surface-kit.frame';

function recordingHost(): { host: LwStateHost; calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    host: {
      stateWatch: (key) => {
        calls.push(`watch ${key}`);
      },
      stateSet: (key, value) => {
        calls.push(`set ${key} ${JSON.stringify(value)}`);
      },
      stateClear: (key) => {
        calls.push(`clear ${key}`);
      },
      stateUnwatch: (key) => {
        calls.push(`unwatch ${key}`);
      },
    },
  };
}

describe('the frame kit state mirror', () => {
  it('sends a write made before the connection once the connection is established', () => {
    const state = createState();
    state.watch<{ note: string }>('scratch').set({ note: 'early' });
    const { host, calls } = recordingHost();

    state.connect(host);

    expect(calls).toEqual(['watch scratch', 'set scratch {"note":"early"}']);
  });

  it('sends only the last early write of a key, and a clear as a clear', () => {
    const state = createState();
    const draft = state.watch<string>('draft');
    draft.set('first');
    draft.set('second');
    const note = state.watch<string>('note');
    note.set('gone');
    note.clear();
    const { host, calls } = recordingHost();

    state.connect(host);

    expect(calls).toEqual([
      'watch draft',
      'watch note',
      'set draft "second"',
      'clear note',
    ]);
  });

  it('still delivers an early write whose handle was disposed before the connection', () => {
    const state = createState();
    const handle = state.watch<string>('scratch');
    handle.set('written');
    handle.dispose();
    const { host, calls } = recordingHost();

    state.connect(host);

    expect(calls).toEqual([
      'watch scratch',
      'set scratch "written"',
      'unwatch scratch',
    ]);
  });

  it('sends a write made after the connection straight away', () => {
    const state = createState();
    const handle = state.watch<string>('scratch');
    const { host, calls } = recordingHost();
    state.connect(host);

    handle.set('now');

    expect(calls).toEqual(['watch scratch', 'set scratch "now"']);
  });
});

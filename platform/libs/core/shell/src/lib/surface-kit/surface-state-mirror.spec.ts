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

  it('keeps a key watched while another handle on it is still in use', () => {
    const state = createState();
    const { host, calls } = recordingHost();
    state.connect(host);
    const first = state.watch<string>('draft');
    const second = state.watch<string>('draft');
    const heard: (string | undefined)[] = [];
    second.onChange((value) => {
      heard.push(value);
    });

    first.dispose();
    second.set('kept');
    state.apply('draft', 'from host', true);

    expect(calls).toEqual(['watch draft', 'set draft "kept"']);
    expect(heard).toEqual(['from host']);

    second.dispose();
    expect(calls.at(-1)).toBe('unwatch draft');
  });

  it('stops telling a disposed handle about changes', () => {
    const state = createState();
    state.connect(recordingHost().host);
    const first = state.watch<string>('draft');
    const second = state.watch<string>('draft');
    const heard: (string | undefined)[] = [];
    first.onChange((value) => {
      heard.push(value);
    });

    first.dispose();
    state.apply('draft', 'later', true);

    expect(heard).toEqual([]);
    second.dispose();
  });

  it('sends a write made after the connection straight away', () => {
    const state = createState();
    const handle = state.watch<string>('scratch');
    const { host, calls } = recordingHost();
    state.connect(host);

    handle.set('now');

    expect(calls).toEqual(['watch scratch', 'set scratch "now"']);
  });

  it('starts no new watch for a push that arrives after its last handle was disposed', () => {
    const state = createState();
    const { host, calls } = recordingHost();
    state.connect(host);
    state.watch<string>('draft').dispose();

    state.apply('draft', 'late', true);

    expect(calls).toEqual(['watch draft', 'unwatch draft']);
  });

  it('tells its watchers once of a push that is applied twice', () => {
    const state = createState();
    state.connect(recordingHost().host);
    const handle = state.watch<{ step: number }>('wizard');
    const heard: unknown[] = [];
    handle.onChange((value, loaded) => {
      heard.push([value, loaded]);
    });
    const pushed = { step: 2 };

    state.apply('wizard', pushed, true);
    state.apply('wizard', pushed, true);

    expect(heard).toEqual([[pushed, true]]);
    handle.dispose();
  });

  it('still tells its watchers of a push that repeats what the surface wrote itself in between', () => {
    const state = createState();
    state.connect(recordingHost().host);
    const handle = state.watch<string>('draft');
    const heard: unknown[] = [];
    handle.onChange((value) => {
      heard.push(value);
    });

    state.apply('draft', 'first', true);
    handle.set('second');
    state.apply('draft', 'second', true);
    handle.clear();
    state.apply('draft', undefined, true);

    expect(heard).toEqual(['first', 'second', undefined]);
    handle.dispose();
  });

  it('says so, and leaves no rejection behind, when the workbench refuses a call', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const refused = new Error('refused');
    const refuse = () => Promise.reject(refused);
    const state = createState();
    state.connect({
      stateWatch: refuse,
      stateSet: refuse,
      stateClear: refuse,
      stateUnwatch: refuse,
    });

    const handle = state.watch<string>('draft');
    handle.set('written');
    handle.clear();
    handle.dispose();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(warn.mock.calls.map((call) => call.at(-1))).toEqual([
      refused,
      refused,
      refused,
      refused,
    ]);
    warn.mockRestore();
  });
});

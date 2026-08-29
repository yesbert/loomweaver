import { TestBed } from '@angular/core/testing';
import { KeyValueStore } from '../persistence/key-value-store';
import { WORKING_STATE_STORE } from '../persistence/working-state-store';
import { PluginStateService } from './plugin-state.service';

const KEY = 'lw.plugin-state:acme:step-1';

function asyncStore(initial: Record<string, string> = {}): KeyValueStore {
  const data = new Map(Object.entries(initial));
  return {
    get: (key) => Promise.resolve(data.get(key)),
    set: (key, value) => {
      data.set(key, value);
      return Promise.resolve();
    },
    delete: (key) => {
      data.delete(key);
      return Promise.resolve();
    },
  };
}

describe('PluginStateService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  function setup(store?: KeyValueStore) {
    TestBed.configureTestingModule({
      providers: store ? [{ provide: WORKING_STATE_STORE, useValue: store }] : [],
    });
    return TestBed.inject(PluginStateService);
  }

  it('keeps a plugin inside its own namespace', () => {
    const service = setup();
    const handle = service.facade('acme').watch<{ note: string }>('step-1');

    handle.set({ note: 'hello' });
    vi.advanceTimersByTime(400);

    expect(localStorage.getItem(KEY)).toBe('{"note":"hello"}');
  });

  it('gives two surfaces of one plugin the same live value', () => {
    const service = setup();
    const first = service.facade('acme').watch<string>('step-1');
    const second = service.facade('acme').watch<string>('step-1');

    first.set('typed here');

    expect(second.value()).toBe('typed here');
  });

  it('separates plugins that use the same key name', () => {
    const service = setup();
    const acme = service.facade('acme').watch<string>('step-1');
    const other = service.facade('other').watch<string>('step-1');

    acme.set('mine');

    expect(other.value()).toBeUndefined();
  });

  it('reports loaded immediately for a peek-capable store', () => {
    const service = setup();
    expect(service.facade('acme').watch('step-1').loaded()).toBe(true);
  });

  it('reports loaded only once a network-backed store has answered', async () => {
    const service = setup(asyncStore({ [KEY]: '"stored"' }));
    const handle = service.facade('acme').watch<string>('step-1');

    expect(handle.loaded()).toBe(false);
    expect(handle.value()).toBeUndefined();

    await vi.waitFor(() => expect(handle.loaded()).toBe(true));
    expect(handle.value()).toBe('stored');
  });

  it('debounces writes and flushes a pending one on the last dispose', () => {
    const service = setup();
    const handle = service.facade('acme').watch<string>('step-1');

    handle.set('a');
    handle.set('b');
    expect(localStorage.getItem(KEY)).toBeNull();

    handle.dispose();
    expect(localStorage.getItem(KEY)).toBe('"b"');
  });

  it('clear removes the key and empties the value', () => {
    const service = setup();
    const handle = service.facade('acme').watch<string>('step-1');
    handle.set('a');
    vi.advanceTimersByTime(400);

    handle.clear();

    expect(handle.value()).toBeUndefined();
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('refuses a value over the size cap instead of writing it', () => {
    const service = setup();
    const handle = service.facade('acme').watch<string>('step-1');
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    handle.set('x'.repeat(70 * 1024));
    vi.advanceTimersByTime(400);

    expect(localStorage.getItem(KEY)).toBeNull();
    expect(error).toHaveBeenCalledWith(expect.stringContaining('refused'));
    error.mockRestore();
  });

  it('refuses a new key past the count cap', () => {
    const service = setup();
    const state = service.facade('acme');
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    for (let index = 0; index < 64; index += 1) {
      state.watch<number>(`k${index}`).set(index);
    }
    state.watch<string>('one-too-many').set('nope');
    vi.advanceTimersByTime(400);

    expect(localStorage.getItem('lw.plugin-state:acme:one-too-many')).toBeNull();
    expect(error).toHaveBeenCalledWith(expect.stringContaining('64 state keys'));
    error.mockRestore();
  });

  it('deletes the whole namespace when the plugin is uninstalled', async () => {
    const service = setup();
    const state = service.facade('acme');
    state.watch<string>('step-1').set('a');
    state.watch<string>('step-2').set('b');
    vi.advanceTimersByTime(400);
    expect(localStorage.getItem(KEY)).toBe('"a"');

    service.removePlugin('acme');
    await vi.waitFor(() =>
      expect(localStorage.getItem('lw.plugin-state:acme:step-2')).toBeNull(),
    );

    expect(localStorage.getItem(KEY)).toBeNull();
    expect(localStorage.getItem('lw.plugin-state-keys:acme')).toBeNull();
  });

  it('rejects an empty key rather than writing to the namespace root', () => {
    const service = setup();
    expect(() => service.facade('acme').watch('')).toThrow(/non-empty key/);
  });
});

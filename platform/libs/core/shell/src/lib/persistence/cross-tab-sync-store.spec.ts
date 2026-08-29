import { CrossTabSyncStore } from './cross-tab-sync-store';
import { KeyValueStore } from './key-value-store';
import { StateSyncChannel } from './state-sync-channel';

function fakeChannel(posted: string[]): StateSyncChannel {
  return {
    post: (key: string) => void posted.push(key),
  } as unknown as StateSyncChannel;
}

describe('CrossTabSyncStore', () => {
  let posted: string[];

  beforeEach(() => {
    posted = [];
    localStorage.clear();
  });

  function wrap(inner: KeyValueStore): CrossTabSyncStore {
    return new CrossTabSyncStore(inner, fakeChannel(posted));
  }

  const peekLess: KeyValueStore = {
    get: () => Promise.resolve('inner'),
    set: () => Promise.resolve(),
    delete: () => Promise.resolve(),
  };

  it('broadcasts the key after a write lands', async () => {
    const store = wrap(peekLess);

    await store.set('k', 'v');

    expect(posted).toEqual(['k']);
  });

  it('broadcasts the key after a delete', async () => {
    const store = wrap(peekLess);

    await store.delete('k');

    expect(posted).toEqual(['k']);
  });

  it('does not broadcast on a read', async () => {
    const store = wrap(peekLess);

    await expect(store.get('k')).resolves.toBe('inner');

    expect(posted).toEqual([]);
  });

  it('omits peek when the wrapped store omits it (async hydration stays detectable)', () => {
    expect(wrap(peekLess).peek).toBeUndefined();
  });

  it('offers peek when the wrapped store offers it', () => {
    const store = wrap({
      ...peekLess,
      peek: (key) => `peeked:${key}`,
    });

    expect(store.peek?.('k')).toBe('peeked:k');
  });

  it('honours best-effort set: a rejecting inner write resolves and does not broadcast', async () => {
    const store = wrap({
      ...peekLess,
      set: () => Promise.reject(new Error('offline')),
    });

    await expect(store.set('k', 'v')).resolves.toBeUndefined();
    expect(posted).toEqual([]);
  });

  it('honours best-effort delete: a rejecting inner delete resolves and does not broadcast', async () => {
    const store = wrap({
      ...peekLess,
      delete: () => Promise.reject(new Error('offline')),
    });

    await expect(store.delete('k')).resolves.toBeUndefined();
    expect(posted).toEqual([]);
  });
});

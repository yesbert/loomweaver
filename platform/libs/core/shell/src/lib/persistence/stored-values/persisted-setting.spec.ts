import { TestBed } from '@angular/core/testing';
import { KeyValueStore } from '../key-value-store';
import { persistedSetting, SettingCodec } from './persisted-setting';
import { SETTINGS_STORE } from '../settings-store';
import { StateSyncService } from '../cross-tab/state-sync.service';

const KEY = 'lw.test.setting';

const WORD: SettingCodec<string> = {
  parse: (raw) => raw ?? 'default',
  serialize: (value) => value,
};

class MapStore implements KeyValueStore {
  readonly values = new Map<string, string>();

  get(key: string): Promise<string | undefined> {
    return Promise.resolve(this.values.get(key));
  }

  set(key: string, value: string): Promise<void> {
    this.values.set(key, value);
    return Promise.resolve();
  }

  delete(key: string): Promise<void> {
    this.values.delete(key);
    return Promise.resolve();
  }
}

class PeekableStore extends MapStore {
  peek(key: string): string | undefined {
    return this.values.get(key);
  }
}

function settingOn(store: KeyValueStore) {
  TestBed.configureTestingModule({
    providers: [{ provide: SETTINGS_STORE, useValue: store }],
  });
  return TestBed.runInInjectionContext(() => persistedSetting(KEY, WORD));
}

function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('persistedSetting', () => {
  it('starts from what a store answers at once', () => {
    const store = new PeekableStore();
    store.values.set(KEY, 'stored');

    expect(settingOn(store).value()).toBe('stored');
  });

  it('starts from the default and takes the stored value once a slower store answers', async () => {
    const store = new MapStore();
    store.values.set(KEY, 'stored');
    const setting = settingOn(store);

    expect(setting.value()).toBe('default');
    await settle();
    expect(setting.value()).toBe('stored');
  });

  it('follows a change another window made', async () => {
    const store = new PeekableStore();
    const setting = settingOn(store);

    store.values.set(KEY, 'elsewhere');
    TestBed.inject(StateSyncService).notifyRemoteChange(KEY);
    await settle();

    expect(setting.value()).toBe('elsewhere');
  });

  it('writes a change back in its stored form', () => {
    const store = new PeekableStore();
    const setting = settingOn(store);

    setting.set('chosen');

    expect(setting.value()).toBe('chosen');
    expect(store.values.get(KEY)).toBe('chosen');
  });

  it('forgets a stored value and falls back to the default', () => {
    const store = new PeekableStore();
    store.values.set(KEY, 'stored');
    const setting = settingOn(store);

    setting.clear();

    expect(setting.value()).toBe('default');
    expect(store.values.has(KEY)).toBe(false);
  });
});

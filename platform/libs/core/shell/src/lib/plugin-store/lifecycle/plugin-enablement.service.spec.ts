import { TestBed } from '@angular/core/testing';
import { SETTINGS_STORE } from '../../persistence/settings-store';
import { KeyValueStore } from '../../persistence/key-value-store';
import { PluginEnablementService } from './plugin-enablement.service';

const KEY = 'lw.shell.disabled-plugins';

function make() {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({});
  return TestBed.inject(PluginEnablementService);
}

function makeWith(store: KeyValueStore) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [{ provide: SETTINGS_STORE, useValue: store }],
  });
  return TestBed.inject(PluginEnablementService);
}

function rejectingStore(): KeyValueStore {
  return {
    get: () => Promise.reject(new Error('401')),
    set: () => Promise.resolve(),
    delete: () => Promise.resolve(),
  };
}

describe('PluginEnablementService', () => {
  afterEach(() => localStorage.clear());

  it('hydrates from a peek-less store and survives one that rejects', async () => {
    const hydrated = makeWith({
      get: () => Promise.resolve(JSON.stringify(['a'])),
      set: () => Promise.resolve(),
      delete: () => Promise.resolve(),
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(hydrated.isEnabled('a')).toBe(false);

    const service = makeWith(rejectingStore());
    await Promise.resolve();
    await Promise.resolve();

    expect(service.isEnabled('a')).toBe(true);
  });

  it('treats a plugin as enabled until it is turned off', () => {
    const service = make();
    service.register('a', 'Alpha');

    expect(service.isEnabled('a')).toBe(true);

    service.setEnabled('a', false);
    expect(service.isEnabled('a')).toBe(false);

    service.setEnabled('a', true);
    expect(service.isEnabled('a')).toBe(true);
  });

  it('persists disabled plugins through the settings store', () => {
    const service = make();
    service.register('a', 'Alpha');

    service.setEnabled('a', false);

    expect(JSON.parse(localStorage.getItem(KEY) ?? '[]')).toEqual(['a']);
  });

  it('re-applies a persisted disabled set on construction', () => {
    localStorage.setItem(KEY, JSON.stringify(['a']));
    const service = make();
    service.register('a', 'Alpha');
    service.register('b', 'Beta');

    expect(service.isEnabled('a')).toBe(false);
    expect(service.isEnabled('b')).toBe(true);
  });

  it('lists every registered plugin with its enabled state, sorted by name', () => {
    const service = make();
    service.register('b', 'Beta');
    service.register('a', 'Alpha');
    service.setEnabled('a', false);

    const view = service.plugins();
    expect(view.map((p) => p.id)).toEqual(['a', 'b']);
    expect(view[0].enabled).toBe(false);
    expect(view[1].enabled).toBe(true);
  });
});

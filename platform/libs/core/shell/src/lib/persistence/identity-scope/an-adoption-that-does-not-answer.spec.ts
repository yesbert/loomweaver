import { TestBed } from '@angular/core/testing';
import { firstValueFrom, Subject } from 'rxjs';
import { NotificationService } from '../../notifications/notification.service';
import { StateSyncService } from '../cross-tab/state-sync.service';
import { KeyValueStore } from '../key-value-store';
import { SETTINGS_STORE } from '../settings-store';
import { provideIdentityScopedStores } from './provide-identity-scoped-stores';

const BOUND_MS = 10_000;

function backend(
  stored: Record<string, string>,
  answers: (key: string) => boolean = () => true,
) {
  const data = new Map(Object.entries(stored));
  const store: KeyValueStore = {
    get: (key) =>
      answers(key)
        ? Promise.resolve(data.get(key))
        : new Promise<string | undefined>(() => undefined),
    set: (key, value) => {
      data.set(key, value);
      return Promise.resolve();
    },
    delete: (key) => {
      data.delete(key);
      return Promise.resolve();
    },
  };
  return { store, data };
}

function signedInLate(store: KeyValueStore) {
  let identity: string | null = null;
  TestBed.configureTestingModule({
    providers: [
      provideIdentityScopedStores({
        identity: () => identity,
        settingsStore: store,
      }),
    ],
  });
  const settings = TestBed.inject(SETTINGS_STORE);
  return {
    settings,
    sync: TestBed.inject(StateSyncService),
    signIn: (id: string) => {
      identity = id;
    },
    told: () =>
      TestBed.inject(NotificationService)
        .notifications()
        .map((notice) => notice.message),
  };
}

describe('an adoption that does not answer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stores what was written during it in the person\'s namespace once the bound has passed, and says so', async () => {
    const remote = backend({}, (key) => !key.startsWith('lw.id.'));
    const app = signedInLate(remote.store);
    await app.settings.get('lw.test.setting');

    app.signIn('ada');
    await app.settings.set('lw.test.setting', 'built meanwhile');
    await vi.advanceTimersByTimeAsync(BOUND_MS - 1);

    expect(remote.data.has('lw.id.ada:lw.test.setting')).toBe(false);
    expect(app.told()).toEqual([]);

    await vi.advanceTimersByTimeAsync(1);

    expect(remote.data.get('lw.id.ada:lw.test.setting')).toBe('built meanwhile');
    expect(app.told()).toEqual(['auth.localWorkKept']);
  });

  it('writes straight to the person\'s namespace once it has been given up', async () => {
    const remote = backend({}, (key) => !key.startsWith('lw.id.'));
    const app = signedInLate(remote.store);
    await app.settings.get('lw.test.setting');
    app.signIn('ada');
    await app.settings.set('lw.test.setting', 'built meanwhile');
    await vi.advanceTimersByTimeAsync(BOUND_MS);

    await app.settings.set('lw.test.later', 'changed since');

    expect(remote.data.get('lw.id.ada:lw.test.later')).toBe('changed since');
  });

  it('copies nothing from the anonymous namespace and deletes nothing there', async () => {
    const remote = backend({ 'lw.test.setting': 'nobodys' });
    const app = signedInLate(remote.store);
    app.sync.onNamespaceAdopted(() => new Promise<void>(() => undefined));
    await app.settings.get('lw.test.setting');

    app.signIn('ada');
    await app.settings.get('lw.test.setting');
    await vi.advanceTimersByTimeAsync(BOUND_MS);

    expect(remote.data.has('lw.id.ada:lw.test.setting')).toBe(false);
    expect(remote.data.get('lw.test.setting')).toBe('nobodys');
    expect(app.told()).toEqual(['auth.localWorkKept']);
  });

  it('takes nothing over from an answer that arrives after the bound', async () => {
    const remote = backend({ 'lw.test.setting': 'nobodys' });
    const app = signedInLate(remote.store);
    const late = new Subject<void>();
    app.sync.onNamespaceAdopted(() => firstValueFrom(late));
    await app.settings.get('lw.test.setting');
    app.signIn('ada');
    await app.settings.get('lw.test.setting');
    await vi.advanceTimersByTimeAsync(BOUND_MS);

    late.next();
    await vi.advanceTimersByTimeAsync(0);

    expect(remote.data.has('lw.id.ada:lw.test.setting')).toBe(false);
  });

  it('says nothing where the adoption answers in time', async () => {
    const remote = backend({ 'lw.test.setting': 'nobodys' });
    const app = signedInLate(remote.store);
    await app.settings.get('lw.test.setting');

    app.signIn('ada');
    await app.settings.get('lw.test.setting');
    await vi.advanceTimersByTimeAsync(BOUND_MS);

    expect(remote.data.get('lw.id.ada:lw.test.setting')).toBe('nobodys');
    expect(app.told()).toEqual([]);
  });
});

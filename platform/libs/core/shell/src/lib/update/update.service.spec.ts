import { DOCUMENT } from '@angular/common';
import { Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  SwUpdate,
  UnrecoverableStateEvent,
  VersionEvent,
} from '@angular/service-worker';
import { Subject } from 'rxjs';
import { UpdateService } from './update.service';
import { DialogService } from '../dialog/dialog.service';
import { NotificationService } from '../notifications/notification.service';
import { RetentionUnloadGuard } from '../regions/pane/unsaved-work/retention-unload-guard';
import { UnsavedWork } from '../regions/pane/unsaved-work/unsaved-work';
import { ANNOUNCE_UPDATES } from './announce-updates';

class FakeSwUpdate {
  isEnabled = true;
  versionUpdates = new Subject<VersionEvent>();
  unrecoverable = new Subject<UnrecoverableStateEvent>();
  checkForUpdate = vi.fn<() => Promise<boolean>>().mockResolvedValue(false);
  activateUpdate = vi.fn<() => Promise<boolean>>().mockResolvedValue(true);
}

function installationFailed(): VersionEvent {
  return {
    type: 'VERSION_INSTALLATION_FAILED',
    version: { hash: 'b' },
    error: 'Hash mismatch',
  } as VersionEvent;
}

function setup(sw?: FakeSwUpdate) {
  TestBed.configureTestingModule({
    providers: sw ? [{ provide: SwUpdate, useValue: sw }] : [],
  });
  const service = TestBed.inject(UpdateService);
  const notifications = TestBed.inject(NotificationService);
  return { service, notifications };
}

function fakeSwContainer() {
  let handler: (() => void) | undefined;
  const container = {
    controller: null as unknown,
    addEventListener: vi.fn((_type: string, h: () => void) => (handler = h)),
    removeEventListener: vi.fn(),
  };
  return { container, fireControllerChange: () => handler?.() };
}

function fakeDocument(defaultView: object) {
  return {
    defaultView: {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      ...defaultView,
    },
    visibilityState: 'visible',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
}

function unrecoverable(): UnrecoverableStateEvent {
  return {
    type: 'UNRECOVERABLE_STATE',
    reason: 'Hash mismatch',
  } as UnrecoverableStateEvent;
}

function shellWorker() {
  const unregister = vi.fn().mockResolvedValue(true);
  const container = {
    getRegistrations: vi.fn().mockResolvedValue([
      {
        scope: 'https://app.test/',
        active: { scriptURL: 'https://app.test/ngsw-worker.js' },
        unregister,
      },
    ]),
  };
  return { container, unregister };
}

function setupBrokenWith(
  sw: FakeSwUpdate,
  worker: { container: unknown; caches?: unknown },
  reload: () => void,
) {
  TestBed.configureTestingModule({
    providers: [
      { provide: SwUpdate, useValue: sw },
      {
        provide: DOCUMENT,
        useValue: fakeDocument({
          navigator: { serviceWorker: worker.container },
          caches: worker.caches,
          location: { reload },
        }),
      },
    ],
  });
  return TestBed.inject(UpdateService);
}

function shellCaches() {
  return {
    keys: vi.fn().mockResolvedValue(['ngsw:/:db:control']),
    delete: vi.fn().mockResolvedValue(true),
  };
}

function documentSeenThrough(defaultView: object): Document {
  return new Proxy(document, {
    get(target, key) {
      if (key === 'defaultView') {
        return defaultView;
      }
      const value: unknown = Reflect.get(target, key);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}

function versionReady(): VersionEvent {
  return {
    type: 'VERSION_READY',
    currentVersion: { hash: 'a' },
    latestVersion: { hash: 'b' },
  } as VersionEvent;
}

function setupOverUnsavedWork(
  instances: readonly unknown[],
  also: readonly Provider[] = [],
) {
  const sw = new FakeSwUpdate();
  const worker = shellWorker();
  const caches = shellCaches();
  const reload = vi.fn();
  const listeners = new Map<string, (event: Event) => void>();
  TestBed.configureTestingModule({
    providers: [
      { provide: SwUpdate, useValue: sw },
      {
        provide: DOCUMENT,
        useValue: documentSeenThrough({
          navigator: { serviceWorker: worker.container },
          caches,
          location: { reload },
          addEventListener: (type: string, listener: (event: Event) => void) =>
            listeners.set(type, listener),
          removeEventListener: vi.fn(),
        }),
      },
      {
        provide: UnsavedWork,
        useValue: { instancesEverywhere: () => [...instances] },
      },
      ...also,
    ],
  });
  return {
    sw,
    worker,
    caches,
    reload,
    leave: (event: Event) => listeners.get('beforeunload')?.(event),
    service: TestBed.inject(UpdateService),
    dialogs: TestBed.inject(DialogService),
  };
}

async function answerTheQuestion(
  dialogs: DialogService,
  choice: 'cancel' | 'discard' | 'save',
): Promise<void> {
  await Promise.resolve();
  const question = dialogs.dialogs().at(-1);
  if (!question) {
    throw new Error('expected to be asked about unsaved work');
  }
  question.ref.close(choice);
}

async function settled(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

function setupWith(sw: FakeSwUpdate, container: unknown) {
  TestBed.configureTestingModule({
    providers: [
      { provide: SwUpdate, useValue: sw },
      {
        provide: DOCUMENT,
        useValue: fakeDocument({ navigator: { serviceWorker: container } }),
      },
    ],
  });
  return {
    service: TestBed.inject(UpdateService),
    notifications: TestBed.inject(NotificationService),
  };
}

describe('UpdateService reporting what it found', () => {
  it('tells the caller there is nothing new', async () => {
    const sw = new FakeSwUpdate();
    sw.checkForUpdate.mockResolvedValue(false);
    const { service } = setup(sw);

    expect(await service.checkForUpdate()).toBe('current');
    expect(service.lastCheck()).toMatchObject({
      outcome: 'current',
      automatic: false,
    });
    expect(service.lastCheck()?.at).toBeGreaterThan(0);
  });

  it('tells the caller a version is waiting', async () => {
    const sw = new FakeSwUpdate();
    sw.checkForUpdate.mockResolvedValue(true);
    const { service } = setup(sw);

    expect(await service.checkForUpdate()).toBe('waiting');
  });

  it('distinguishes a question it could not answer from a current one', async () => {
    vi.useFakeTimers();
    try {
      const sw = new FakeSwUpdate();
      const { container } = fakeSwContainer();
      const { service } = setupWith(sw, container);

      const pending = service.checkForUpdate();
      await Promise.resolve();
      vi.advanceTimersByTime(2500);

      expect(await pending).toBe('unreachable');
      expect(service.lastCheck()?.outcome).toBe('unreachable');
    } finally {
      vi.useRealTimers();
    }
  });

  it('records the check the workbench makes by itself', async () => {
    vi.useFakeTimers();
    try {
      const sw = new FakeSwUpdate();
      sw.checkForUpdate.mockResolvedValue(false);
      const { service } = setup(sw);

      await vi.advanceTimersByTimeAsync(30 * 60 * 1000);

      expect(service.lastCheck()).toMatchObject({
        outcome: 'current',
        automatic: true,
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('a background check after a failed installation records the failure, not a current version', async () => {
    vi.useFakeTimers();
    try {
      const sw = new FakeSwUpdate();
      sw.checkForUpdate.mockResolvedValue(false);
      const { service } = setup(sw);
      sw.versionUpdates.next(installationFailed());

      await vi.advanceTimersByTimeAsync(30 * 60 * 1000);

      expect(service.lastCheck()).toMatchObject({
        outcome: 'failed',
        automatic: true,
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('tells the caller when there is no offline machinery at all', async () => {
    const { service } = setup();

    expect(await service.checkForUpdate()).toBe('unavailable');
    expect(service.lastCheck()?.outcome).toBe('unavailable');
  });
});

describe('UpdateService applying an update over unsaved work', () => {
  const unsaved = () => ({ surfaceDirty: () => true });

  it('declining leaves the worker untouched and does not reload', async () => {
    const app = setupOverUnsavedWork([unsaved()]);

    const applied = app.service.activateUpdate();
    await answerTheQuestion(app.dialogs, 'cancel');
    await applied;

    expect(app.sw.activateUpdate).not.toHaveBeenCalled();
    expect(app.reload).not.toHaveBeenCalled();
  });

  it('declining out of a broken state keeps the worker and its caches', async () => {
    const app = setupOverUnsavedWork([unsaved()]);
    app.sw.unrecoverable.next(unrecoverable());

    const applied = app.service.activateUpdate();
    await answerTheQuestion(app.dialogs, 'cancel');
    await applied;

    expect(app.worker.unregister).not.toHaveBeenCalled();
    expect(app.caches.delete).not.toHaveBeenCalled();
    expect(app.reload).not.toHaveBeenCalled();
  });

  it('activates nothing while the question is still open', async () => {
    const app = setupOverUnsavedWork([unsaved()]);

    const applied = app.service.activateUpdate();
    await Promise.resolve();

    expect(app.dialogs.dialogs()).toHaveLength(1);
    expect(app.sw.activateUpdate).not.toHaveBeenCalled();
    expect(app.reload).not.toHaveBeenCalled();

    await answerTheQuestion(app.dialogs, 'cancel');
    await applied;
  });

  it('consenting activates, then reloads once without a second question from the browser', async () => {
    const app = setupOverUnsavedWork([unsaved()]);
    const leaving = new Event('beforeunload', { cancelable: true });
    TestBed.inject(RetentionUnloadGuard).start();

    const applied = app.service.activateUpdate();
    await answerTheQuestion(app.dialogs, 'discard');
    await applied;
    app.leave(leaving);

    expect(app.sw.activateUpdate).toHaveBeenCalledTimes(1);
    expect(app.reload).toHaveBeenCalledTimes(1);
    expect(leaving.defaultPrevented).toBe(false);
  });

  it('consenting out of a broken state drops the worker and its caches, then reloads once', async () => {
    const app = setupOverUnsavedWork([unsaved()]);
    app.sw.unrecoverable.next(unrecoverable());

    const applied = app.service.activateUpdate();
    await answerTheQuestion(app.dialogs, 'discard');
    await applied;

    expect(app.worker.unregister).toHaveBeenCalledTimes(1);
    expect(app.caches.delete).toHaveBeenCalledWith('ngsw:/:db:control');
    expect(app.reload).toHaveBeenCalledTimes(1);
  });

  it('a second request while the question is open joins the first instead of asking again', async () => {
    const app = setupOverUnsavedWork([unsaved()]);

    const first = app.service.activateUpdate();
    const second = app.service.activateUpdate();
    await Promise.resolve();

    expect(app.dialogs.dialogs()).toHaveLength(1);

    await answerTheQuestion(app.dialogs, 'discard');
    await Promise.all([first, second]);

    expect(app.sw.activateUpdate).toHaveBeenCalledTimes(1);
    expect(app.reload).toHaveBeenCalledTimes(1);
  });

  it('a request after a decline asks again', async () => {
    const app = setupOverUnsavedWork([unsaved()]);
    const declined = app.service.activateUpdate();
    await answerTheQuestion(app.dialogs, 'cancel');
    await declined;

    const again = app.service.activateUpdate();
    await answerTheQuestion(app.dialogs, 'discard');
    await again;

    expect(app.sw.activateUpdate).toHaveBeenCalledTimes(1);
    expect(app.reload).toHaveBeenCalledTimes(1);
  });

  it('a request after a save that never settles asks afresh instead of hanging with it', async () => {
    const stuck = {
      surfaceDirty: () => true,
      surfaceSave: () => new Promise<void>(() => undefined),
    };
    const app = setupOverUnsavedWork([stuck]);
    void app.service.activateUpdate();
    await answerTheQuestion(app.dialogs, 'save');
    await settled();

    const again = app.service.activateUpdate();
    await answerTheQuestion(app.dialogs, 'discard');
    await again;

    expect(app.sw.activateUpdate).toHaveBeenCalledTimes(1);
    expect(app.reload).toHaveBeenCalledTimes(1);
  });

  it('a request after a worker that never answers starts afresh', async () => {
    const app = setupOverUnsavedWork([]);
    app.sw.activateUpdate.mockReturnValueOnce(new Promise<boolean>(() => undefined));
    void app.service.activateUpdate();
    await settled();

    await app.service.activateUpdate();

    expect(app.sw.activateUpdate).toHaveBeenCalledTimes(2);
    expect(app.reload).toHaveBeenCalledTimes(1);
  });

  it('a question that cannot be put abandons a healthy update without rejecting', async () => {
    const app = setupOverUnsavedWork([unsaved()]);
    const complaint = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(app.dialogs, 'open').mockImplementation(() => {
      throw new Error('no outlet');
    });

    await expect(app.service.activateUpdate()).resolves.toBeUndefined();

    expect(app.sw.activateUpdate).not.toHaveBeenCalled();
    expect(app.reload).not.toHaveBeenCalled();
    expect(complaint).toHaveBeenCalled();
    complaint.mockRestore();
  });

  it('a lookup of unsaved work that throws abandons a healthy update, and the next request is not stuck behind it', async () => {
    const app = setupOverUnsavedWork([]);
    const complaint = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const lookup = vi
      .spyOn(TestBed.inject(UnsavedWork), 'instancesEverywhere')
      .mockImplementationOnce(() => {
        throw new Error('stash unreadable');
      });

    await expect(app.service.activateUpdate()).resolves.toBeUndefined();
    expect(app.reload).not.toHaveBeenCalled();

    await app.service.activateUpdate();

    expect(lookup).toHaveBeenCalledTimes(2);
    expect(app.reload).toHaveBeenCalledTimes(1);
    complaint.mockRestore();
  });

  it('a question that cannot be put still recovers out of a broken state, and leaves the browser to ask', async () => {
    const app = setupOverUnsavedWork([unsaved()]);
    const complaint = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const leaving = new Event('beforeunload', { cancelable: true });
    TestBed.inject(RetentionUnloadGuard).start();
    vi.spyOn(app.dialogs, 'open').mockImplementation(() => {
      throw new Error('no outlet');
    });
    app.sw.unrecoverable.next(unrecoverable());

    await expect(app.service.activateUpdate()).resolves.toBeUndefined();
    app.leave(leaving);

    expect(app.worker.unregister).toHaveBeenCalledTimes(1);
    expect(app.reload).toHaveBeenCalledTimes(1);
    expect(leaving.defaultPrevented).toBe(true);
    complaint.mockRestore();
  });

  it('a failed activation after consent keeps the session and the work, and says so', async () => {
    const app = setupOverUnsavedWork([unsaved()]);
    const complaint = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const leaving = new Event('beforeunload', { cancelable: true });
    TestBed.inject(RetentionUnloadGuard).start();
    app.sw.versionUpdates.next(versionReady());
    app.sw.activateUpdate.mockRejectedValueOnce(new Error('no waiting worker'));

    const applied = app.service.activateUpdate();
    await answerTheQuestion(app.dialogs, 'discard');
    await applied;
    app.leave(leaving);

    expect(app.reload).not.toHaveBeenCalled();
    expect(leaving.defaultPrevented).toBe(true);
    expect(app.service.updateAvailable()).toBe(true);
    const notice = TestBed.inject(NotificationService)
      .notifications()
      .find((shown) => shown.message === 'update.activationFailed');
    expect(notice?.kind).toBe('warning');
    complaint.mockRestore();
  });

  it('a failed activation is told also where the product announces updates', async () => {
    const app = setupOverUnsavedWork([], [{ provide: ANNOUNCE_UPDATES, useValue: false }]);
    const complaint = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    app.sw.activateUpdate.mockRejectedValueOnce(new Error('no waiting worker'));

    await app.service.activateUpdate();

    expect(app.reload).not.toHaveBeenCalled();
    expect(
      TestBed.inject(NotificationService)
        .notifications()
        .map((shown) => shown.message),
    ).toEqual(['update.activationFailed']);
    complaint.mockRestore();
  });

  it('applying again after a failed activation asks and activates afresh', async () => {
    const app = setupOverUnsavedWork([unsaved()]);
    const complaint = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    app.sw.versionUpdates.next(versionReady());
    app.sw.activateUpdate.mockRejectedValueOnce(new Error('no waiting worker'));
    const failed = app.service.activateUpdate();
    await answerTheQuestion(app.dialogs, 'discard');
    await failed;

    const again = app.service.activateUpdate();
    await answerTheQuestion(app.dialogs, 'discard');
    await again;

    expect(app.sw.activateUpdate).toHaveBeenCalledTimes(2);
    expect(app.reload).toHaveBeenCalledTimes(1);
    complaint.mockRestore();
  });

  it('asks nothing where nothing is unsaved', async () => {
    const app = setupOverUnsavedWork([{ surfaceDirty: () => false }]);

    await app.service.activateUpdate();

    expect(app.dialogs.dialogs()).toHaveLength(0);
    expect(app.sw.activateUpdate).toHaveBeenCalledTimes(1);
    expect(app.reload).toHaveBeenCalledTimes(1);
  });
});

describe('UpdateService where the product announces', () => {
  function quiet(sw: FakeSwUpdate) {
    TestBed.configureTestingModule({
      providers: [
        { provide: SwUpdate, useValue: sw },
        { provide: ANNOUNCE_UPDATES, useValue: false },
      ],
    });
    return {
      service: TestBed.inject(UpdateService),
      notifications: TestBed.inject(NotificationService),
    };
  }

  it('shows nothing and still reports what it found', async () => {
    const sw = new FakeSwUpdate();
    sw.checkForUpdate.mockResolvedValue(false);
    const { service, notifications } = quiet(sw);

    expect(await service.checkForUpdate()).toBe('current');
    expect(notifications.notifications()).toHaveLength(0);
  });

  it('shows nothing when a version becomes ready, and still knows', () => {
    const sw = new FakeSwUpdate();
    const { service, notifications } = quiet(sw);

    sw.versionUpdates.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'a' },
      latestVersion: { hash: 'b' },
    } as VersionEvent);

    expect(service.updateAvailable()).toBe(true);
    expect(notifications.notifications()).toHaveLength(0);
  });

  it('shows nothing when an installation fails, and still knows', () => {
    const sw = new FakeSwUpdate();
    const { service, notifications } = quiet(sw);

    sw.versionUpdates.next(installationFailed());

    expect(service.updateFailed()).toBe(true);
    expect(notifications.notifications()).toHaveLength(0);
  });
});

describe('UpdateService', () => {
  it('is inert without a service worker (SwUpdate not provided)', async () => {
    const { service, notifications } = setup();
    expect(service.enabled).toBe(false);
    expect(service.updateAvailable()).toBe(false);
    await service.checkForUpdate();
    expect(notifications.notifications()).toHaveLength(0);
  });

  it('flags an update and raises a sticky toast with a reload action on VERSION_READY', () => {
    const sw = new FakeSwUpdate();
    const { service, notifications } = setup(sw);

    sw.versionUpdates.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'a' },
      latestVersion: { hash: 'b' },
    } as VersionEvent);

    expect(service.updateAvailable()).toBe(true);
    const toast = notifications
      .notifications()
      .find((t) => t.id === 'shell.update');
    expect(toast?.message).toBe('update.available');
    expect(toast?.action?.label).toBe('update.reload');
  });

  it('notes "up to date" on a manual check that finds nothing', async () => {
    const sw = new FakeSwUpdate();
    sw.checkForUpdate.mockResolvedValue(false);
    const { service, notifications } = setup(sw);

    await service.checkForUpdate();

    expect(sw.checkForUpdate).toHaveBeenCalled();
    expect(
      notifications.notifications().find((t) => t.id === 'shell.update.none')
        ?.message,
    ).toBe('update.upToDate');
  });

  it('stays quiet on a manual check that finds an update (VERSION_READY drives the UI)', async () => {
    const sw = new FakeSwUpdate();
    sw.checkForUpdate.mockResolvedValue(true);
    const { service, notifications } = setup(sw);

    await service.checkForUpdate();

    expect(notifications.notifications()).toHaveLength(0);
  });

  it('waits for the worker to take control, then checks (fresh load)', async () => {
    const sw = new FakeSwUpdate();
    sw.checkForUpdate.mockResolvedValue(false);
    const { container, fireControllerChange } = fakeSwContainer();
    const { service, notifications } = setupWith(sw, container);

    const pending = service.checkForUpdate();
    await Promise.resolve();
    container.controller = {};
    fireControllerChange();
    await pending;

    expect(sw.checkForUpdate).toHaveBeenCalled();
    expect(
      notifications.notifications().find((t) => t.id === 'shell.update.none')
        ?.message,
    ).toBe('update.upToDate');
  });

  it('asks to reload when the page never gains a controller (hard reload)', async () => {
    vi.useFakeTimers();
    try {
      const sw = new FakeSwUpdate();
      const { container } = fakeSwContainer();
      const { service, notifications } = setupWith(sw, container);

      const pending = service.checkForUpdate();
      await Promise.resolve();
      vi.advanceTimersByTime(2500);
      await pending;

      expect(sw.checkForUpdate).not.toHaveBeenCalled();
      expect(
        notifications
          .notifications()
          .find((t) => t.id === 'shell.update.unavailable')?.message,
      ).toBe('update.checkUnavailable');
    } finally {
      vi.useRealTimers();
    }
  });

  it('reports unavailable when a check on a controlled page never resolves (backstop timeout)', async () => {
    vi.useFakeTimers();
    try {
      const sw = new FakeSwUpdate();
      sw.checkForUpdate.mockReturnValue(new Promise<boolean>(() => undefined));
      const { service, notifications } = setup(sw);

      const pending = service.checkForUpdate();
      await Promise.resolve();
      vi.advanceTimersByTime(3500);
      await pending;

      expect(
        notifications
          .notifications()
          .find((t) => t.id === 'shell.update.unavailable')?.message,
      ).toBe('update.checkUnavailable');
    } finally {
      vi.useRealTimers();
    }
  });

  it('reloads when activation finds nothing to activate, which is the retry after a failed installation', async () => {
    const sw = new FakeSwUpdate();
    sw.activateUpdate.mockResolvedValue(false);
    const reload = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        { provide: SwUpdate, useValue: sw },
        {
          provide: DOCUMENT,
          useValue: fakeDocument({ location: { reload } }),
        },
      ],
    });
    const service = TestBed.inject(UpdateService);

    await service.activateUpdate();

    expect(sw.activateUpdate).toHaveBeenCalled();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('surfaces a failed installation as a sticky reload toast (VERSION_INSTALLATION_FAILED)', () => {
    const sw = new FakeSwUpdate();
    const { service, notifications } = setup(sw);

    sw.versionUpdates.next(installationFailed());

    expect(service.updateFailed()).toBe(true);
    const toast = notifications
      .notifications()
      .find((t) => t.id === 'shell.update.failed');
    expect(toast?.message).toBe('update.failed');
    expect(toast?.kind).toBe('warning');
    expect(toast?.action?.label).toBe('update.reload');
  });

  it('names a broken worker cache for what it is instead of blaming the update', () => {
    const sw = new FakeSwUpdate();
    const { service, notifications } = setup(sw);

    sw.unrecoverable.next(unrecoverable());

    expect(service.updateFailed()).toBe(true);
    expect(service.updateBroken()).toBe(true);
    const toast = notifications
      .notifications()
      .find((t) => t.id === 'shell.update.broken');
    expect(toast?.message).toBe('update.broken');
    expect(toast?.action?.label).toBe('update.repair');
  });

  it('drops the shell worker before reloading out of a broken state', async () => {
    const sw = new FakeSwUpdate();
    const worker = shellWorker();
    const reload = vi.fn();
    const service = setupBrokenWith(sw, worker, reload);

    sw.unrecoverable.next(unrecoverable());
    await service.activateUpdate();

    expect(worker.unregister).toHaveBeenCalledTimes(1);
    expect(sw.activateUpdate).not.toHaveBeenCalled();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('still reloads when unregistering throws (the repair is never a dead end)', async () => {
    const sw = new FakeSwUpdate();
    const reload = vi.fn();
    const service = setupBrokenWith(
      sw,
      { container: { getRegistrations: () => Promise.reject(new Error('denied')) } },
      reload,
    );

    sw.unrecoverable.next(unrecoverable());
    await service.activateUpdate();

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('activates normally when the worker is healthy — only a broken one is dropped', async () => {
    const sw = new FakeSwUpdate();
    const worker = shellWorker();
    const service = setupBrokenWith(sw, worker, vi.fn());

    sw.versionUpdates.next(installationFailed());
    await service.activateUpdate();

    expect(sw.activateUpdate).toHaveBeenCalled();
    expect(worker.unregister).not.toHaveBeenCalled();
  });

  it('re-raises the failure on a manual check instead of claiming "up to date"', async () => {
    const sw = new FakeSwUpdate();
    sw.checkForUpdate.mockResolvedValue(false);
    const { service, notifications } = setup(sw);
    sw.versionUpdates.next(installationFailed());
    notifications.dismiss('shell.update.failed');

    await service.checkForUpdate();

    expect(
      notifications.notifications().find((t) => t.id === 'shell.update.none'),
    ).toBeUndefined();
    expect(
      notifications.notifications().find((t) => t.id === 'shell.update.failed'),
    ).toBeDefined();
  });

  it('re-raises the update toast on a manual check while an update is waiting (never claims up to date)', async () => {
    const sw = new FakeSwUpdate();
    sw.checkForUpdate.mockResolvedValue(false);
    const { service, notifications } = setup(sw);
    sw.versionUpdates.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'a' },
      latestVersion: { hash: 'b' },
    } as VersionEvent);
    notifications.dismiss('shell.update');

    await service.checkForUpdate();

    expect(sw.checkForUpdate).not.toHaveBeenCalled();
    expect(
      notifications.notifications().find((t) => t.id === 'shell.update.none'),
    ).toBeUndefined();
    expect(
      notifications.notifications().find((t) => t.id === 'shell.update'),
    ).toBeDefined();
  });

  it('throttles the visibility check right after a manual check (no duplicate network hit)', async () => {
    const sw = new FakeSwUpdate();
    sw.checkForUpdate.mockResolvedValue(false);
    const { service } = setup(sw);

    await service.checkForUpdate();
    expect(sw.checkForUpdate).toHaveBeenCalledTimes(1);

    document.dispatchEvent(new Event('visibilitychange'));
    await Promise.resolve();

    expect(sw.checkForUpdate).toHaveBeenCalledTimes(1);
  });

  it('clears the failed state once a later update becomes ready', () => {
    const sw = new FakeSwUpdate();
    const { service } = setup(sw);
    sw.versionUpdates.next(installationFailed());

    sw.versionUpdates.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'a' },
      latestVersion: { hash: 'c' },
    } as VersionEvent);

    expect(service.updateFailed()).toBe(false);
    expect(service.updateAvailable()).toBe(true);
  });

  it('checks periodically in the background without toasting', async () => {
    vi.useFakeTimers();
    try {
      const sw = new FakeSwUpdate();
      sw.checkForUpdate.mockResolvedValue(false);
      const { notifications } = setup(sw);

      vi.advanceTimersByTime(30 * 60 * 1000);
      await Promise.resolve();

      expect(sw.checkForUpdate).toHaveBeenCalled();
      expect(notifications.notifications()).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('checks when the tab becomes visible again (long-lived sessions)', async () => {
    const sw = new FakeSwUpdate();
    sw.checkForUpdate.mockResolvedValue(false);
    const { notifications } = setup(sw);

    document.dispatchEvent(new Event('visibilitychange'));
    await Promise.resolve();

    expect(sw.checkForUpdate).toHaveBeenCalled();
    expect(notifications.notifications()).toHaveLength(0);
  });

  it('stops background checking once an update is already waiting', () => {
    const sw = new FakeSwUpdate();
    const { service } = setup(sw);
    sw.versionUpdates.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'a' },
      latestVersion: { hash: 'b' },
    } as VersionEvent);
    expect(service.updateAvailable()).toBe(true);

    document.dispatchEvent(new Event('visibilitychange'));

    expect(sw.checkForUpdate).not.toHaveBeenCalled();
  });
});

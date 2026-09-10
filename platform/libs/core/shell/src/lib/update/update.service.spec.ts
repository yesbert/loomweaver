import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import {
  SwUpdate,
  UnrecoverableStateEvent,
  VersionEvent,
} from '@angular/service-worker';
import { Subject } from 'rxjs';
import { UpdateService } from './update.service';
import { NotificationService } from '../notifications/notification.service';
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

function fakeDocument(defaultView: unknown) {
  return {
    defaultView,
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

function workerWithNeighboursTheRepairMustLeaveStanding() {
  const unregister = vi.fn().mockResolvedValue(true);
  const foreignUnregister = vi.fn().mockResolvedValue(true);
  const keys = [
    'ngsw:/:db:control',
    'ngsw:/:abc:assets:app:cache',
    'product:own-cache',
  ];
  const cacheDelete = vi.fn(async (key: string) => {
    const at = keys.indexOf(key);
    if (at !== -1) {
      keys.splice(at, 1);
    }
    return true;
  });
  const container = {
    getRegistrations: vi.fn().mockResolvedValue([
      { active: { scriptURL: 'https://app.test/ngsw-worker.js' }, unregister },
      {
        active: { scriptURL: 'https://app.test/other-worker.js' },
        unregister: foreignUnregister,
      },
    ]),
  };
  return {
    container,
    unregister,
    foreignUnregister,
    cacheDelete,
    remaining: () => [...keys],
    caches: { keys: async () => [...keys], delete: cacheDelete },
  };
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

  it('tells the caller when there is no offline machinery at all', async () => {
    const { service } = setup();

    expect(await service.checkForUpdate()).toBe('unavailable');
    expect(service.lastCheck()?.outcome).toBe('unavailable');
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

  it('reloads even when SW activation rejects (the reload click never silently no-ops)', async () => {
    const sw = new FakeSwUpdate();
    sw.activateUpdate.mockRejectedValue(new Error('no waiting worker'));
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

  it('drops the shell worker and its caches before reloading out of a broken state', async () => {
    const sw = new FakeSwUpdate();
    const worker = workerWithNeighboursTheRepairMustLeaveStanding();
    const reload = vi.fn();
    const service = setupBrokenWith(sw, worker, reload);

    sw.unrecoverable.next(unrecoverable());
    await service.activateUpdate();

    expect(worker.unregister).toHaveBeenCalledTimes(1);
    expect(worker.cacheDelete).toHaveBeenCalledWith('ngsw:/:db:control');
    expect(worker.remaining()).toEqual(['product:own-cache']);
    expect(sw.activateUpdate).not.toHaveBeenCalled();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('leaves a foreign worker alone while repairing its own', async () => {
    const sw = new FakeSwUpdate();
    const worker = workerWithNeighboursTheRepairMustLeaveStanding();
    const service = setupBrokenWith(sw, worker, vi.fn());

    sw.unrecoverable.next(unrecoverable());
    await service.activateUpdate();

    expect(worker.foreignUnregister).not.toHaveBeenCalled();
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
    const worker = workerWithNeighboursTheRepairMustLeaveStanding();
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

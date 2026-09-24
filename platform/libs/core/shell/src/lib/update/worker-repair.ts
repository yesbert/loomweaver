const WORKER_SCRIPT = 'ngsw-worker.js';

const WORKER_CACHE_PREFIX = 'ngsw:';

export async function dropShellWorker(view: Window | null): Promise<void> {
  const container = view?.navigator?.serviceWorker;
  await bestEffort(async () => {
    const registrations = (await container?.getRegistrations()) ?? [];
    await Promise.all(
      registrations
        .filter((registration) => isShellWorker(registration))
        .map((registration) => registration.unregister()),
    );
  });
  await bestEffort(async () => {
    const storage = view?.caches;
    const keys = (await storage?.keys()) ?? [];
    await Promise.all(
      keys
        .filter((key) => key.startsWith(WORKER_CACHE_PREFIX))
        .map(async (key) => storage?.delete(key)),
    );
  });
}

async function bestEffort(work: () => Promise<unknown>): Promise<void> {
  try {
    await work();
  } catch {
    return;
  }
}

function isShellWorker(registration: ServiceWorkerRegistration): boolean {
  const worker =
    registration.active ?? registration.waiting ?? registration.installing;
  return worker?.scriptURL.includes(WORKER_SCRIPT) ?? false;
}

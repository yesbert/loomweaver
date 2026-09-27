const WORKER_SCRIPT = 'ngsw-worker.js';

export async function dropShellWorker(
  view: Window | null,
  scope: string,
): Promise<void> {
  const container = view?.navigator?.serviceWorker;
  await bestEffort(async () => {
    const registrations = (await container?.getRegistrations()) ?? [];
    await Promise.all(
      registrations
        .filter((registration) => isShellWorker(registration, scope))
        .map((registration) => registration.unregister()),
    );
  });
  await bestEffort(async () => {
    const storage = view?.caches;
    const keys = (await storage?.keys()) ?? [];
    await Promise.all(
      keys
        .filter((key) => key.startsWith(`ngsw:${scope}:`))
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

function isShellWorker(
  registration: ServiceWorkerRegistration,
  scope: string,
): boolean {
  const worker =
    registration.active ?? registration.waiting ?? registration.installing;
  return (
    (worker?.scriptURL.includes(WORKER_SCRIPT) ?? false) &&
    new URL(registration.scope).pathname === scope
  );
}

import { dropShellWorker } from './worker-repair';

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

function windowWith(worker: { container: unknown; caches?: unknown }): Window {
  return {
    navigator: { serviceWorker: worker.container },
    caches: worker.caches,
  } as unknown as Window;
}

describe('dropShellWorker', () => {
  it('unregisters the shell worker and drops its caches', async () => {
    const worker = workerWithNeighboursTheRepairMustLeaveStanding();

    await dropShellWorker(windowWith(worker));

    expect(worker.unregister).toHaveBeenCalledTimes(1);
    expect(worker.cacheDelete).toHaveBeenCalledWith('ngsw:/:db:control');
    expect(worker.remaining()).toEqual(['product:own-cache']);
  });

  it('leaves a foreign worker alone while repairing its own', async () => {
    const worker = workerWithNeighboursTheRepairMustLeaveStanding();

    await dropShellWorker(windowWith(worker));

    expect(worker.foreignUnregister).not.toHaveBeenCalled();
  });

  it('settles when unregistering throws, so the repair is never a dead end', async () => {
    const view = windowWith({
      container: {
        getRegistrations: () => Promise.reject(new Error('denied')),
      },
    });

    await expect(dropShellWorker(view)).resolves.toBeUndefined();
  });
});

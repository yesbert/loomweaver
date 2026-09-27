import { dropShellWorker } from './worker-repair';

function workersOnOneOrigin() {
  const atTheRoot = vi.fn().mockResolvedValue(true);
  const underAPath = vi.fn().mockResolvedValue(true);
  const foreign = vi.fn().mockResolvedValue(true);
  const keys = [
    'ngsw:/:db:control',
    'ngsw:/:abc:assets:app:cache',
    'ngsw:/x/:db:control',
    'ngsw:/x/:abc:assets:app:cache',
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
      {
        scope: 'https://app.test/',
        active: { scriptURL: 'https://app.test/ngsw-worker.js' },
        unregister: atTheRoot,
      },
      {
        scope: 'https://app.test/x/',
        active: { scriptURL: 'https://app.test/x/ngsw-worker.js' },
        unregister: underAPath,
      },
      {
        scope: 'https://app.test/',
        active: { scriptURL: 'https://app.test/other-worker.js' },
        unregister: foreign,
      },
    ]),
  };
  return {
    container,
    atTheRoot,
    underAPath,
    foreign,
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
    const worker = workersOnOneOrigin();

    await dropShellWorker(windowWith(worker), '/');

    expect(worker.atTheRoot).toHaveBeenCalledTimes(1);
    expect(worker.cacheDelete).toHaveBeenCalledWith('ngsw:/:db:control');
    expect(worker.remaining()).not.toContain('ngsw:/:db:control');
    expect(worker.remaining()).not.toContain('ngsw:/:abc:assets:app:cache');
  });

  it('leaves a foreign worker alone while repairing its own', async () => {
    const worker = workersOnOneOrigin();

    await dropShellWorker(windowWith(worker), '/');

    expect(worker.foreign).not.toHaveBeenCalled();
    expect(worker.remaining()).toContain('product:own-cache');
  });

  it('leaves the distribution under a path alone while repairing the one at the root', async () => {
    const worker = workersOnOneOrigin();

    await dropShellWorker(windowWith(worker), '/');

    expect(worker.underAPath).not.toHaveBeenCalled();
    expect(worker.remaining()).toEqual([
      'ngsw:/x/:db:control',
      'ngsw:/x/:abc:assets:app:cache',
      'product:own-cache',
    ]);
  });

  it('leaves the distribution at the root alone while repairing the one under a path', async () => {
    const worker = workersOnOneOrigin();

    await dropShellWorker(windowWith(worker), '/x/');

    expect(worker.underAPath).toHaveBeenCalledTimes(1);
    expect(worker.atTheRoot).not.toHaveBeenCalled();
    expect(worker.remaining()).toEqual([
      'ngsw:/:db:control',
      'ngsw:/:abc:assets:app:cache',
      'product:own-cache',
    ]);
  });

  it('settles when unregistering throws, so the repair is never a dead end', async () => {
    const view = windowWith({
      container: {
        getRegistrations: () => Promise.reject(new Error('denied')),
      },
    });

    await expect(dropShellWorker(view, '/')).resolves.toBeUndefined();
  });
});

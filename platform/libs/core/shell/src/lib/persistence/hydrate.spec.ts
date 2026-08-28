import { KeyValueStore } from './key-value-store';
import { hydrateAsync } from './hydrate';

function asyncStore(get: () => Promise<string | undefined>): KeyValueStore {
  return {
    get,
    set: () => Promise.resolve(),
    delete: () => Promise.resolve(),
  };
}

describe('hydrateAsync', () => {
  it('applies the stored value when the store answers', async () => {
    const applied: (string | undefined)[] = [];

    hydrateAsync(
      asyncStore(() => Promise.resolve('dark')),
      'k',
      (raw) => applied.push(raw),
    );
    await Promise.resolve();

    expect(applied).toEqual(['dark']);
  });

  it('swallows a rejecting store instead of leaving an unhandled rejection', async () => {
    const applied: (string | undefined)[] = [];
    const rejection = new Error('401');

    expect(() =>
      hydrateAsync(
        asyncStore(() => Promise.reject(rejection)),
        'k',
        (raw) => applied.push(raw),
      ),
    ).not.toThrow();
    await Promise.resolve();
    await Promise.resolve();

    expect(applied).toEqual([]);
  });

  it('does nothing when the store answers synchronously via peek', async () => {
    const get = vi.fn(() => Promise.resolve('x'));

    hydrateAsync({ ...asyncStore(get), peek: () => 'x' }, 'k', () => undefined);
    await Promise.resolve();

    expect(get).not.toHaveBeenCalled();
  });
});

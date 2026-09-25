import { describe, expect, it, vi } from 'vitest';
import { withinDeadline } from './deadline';

describe('withinDeadline', () => {
  it('answers with what the surface drew', async () => {
    await expect(withinDeadline(Promise.resolve('drawn'), 50)).resolves.toBe(
      'drawn',
    );
  });

  it('gives up on a surface that never answers', async () => {
    vi.useFakeTimers();
    const pending = withinDeadline(new Promise<string>(() => undefined), 4000);
    await vi.advanceTimersByTimeAsync(4000);
    await expect(pending).resolves.toBeUndefined();
    vi.useRealTimers();
  });

  it('treats a surface that fails as one that could not be drawn', async () => {
    await expect(
      withinDeadline(Promise.reject(new Error('no renderer')), 50),
    ).resolves.toBeUndefined();
  });

  it('does not hold a timer open once the surface has answered', async () => {
    vi.useFakeTimers();
    const clear = vi.spyOn(globalThis, 'clearTimeout');
    await withinDeadline(Promise.resolve('drawn'), 4000);
    expect(clear).toHaveBeenCalled();
    clear.mockRestore();
    vi.useRealTimers();
  });
});

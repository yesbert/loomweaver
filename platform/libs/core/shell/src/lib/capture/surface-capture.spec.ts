import { describe, expect, it, vi } from 'vitest';
import {
  readSurfaceCapture,
  withinDeadline,
} from './surface-capture';

const PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

describe('readSurfaceCapture', () => {
  it('accepts a drawing a surface answered with', () => {
    expect(
      readSurfaceCapture({ image: PIXEL, width: 640, height: 480 }),
    ).toEqual({ image: PIXEL, width: 640, height: 480 });
  });

  it('drops fields the workbench does not know', () => {
    const answer = {
      image: PIXEL,
      width: 8,
      height: 8,
      onDone: 'not a known field',
      nested: { deep: true },
    };
    expect(readSurfaceCapture(answer)).toEqual({
      image: PIXEL,
      width: 8,
      height: 8,
    });
  });

  it('refuses an address that would make the workbench fetch something', () => {
    expect(
      readSurfaceCapture({
        image: 'https://example.test/looks-like-a-drawing.png',
        width: 8,
        height: 8,
      }),
    ).toBeUndefined();
  });

  it('refuses a drawing that carries markup rather than an image', () => {
    expect(
      readSurfaceCapture({
        image: 'data:text/html;base64,PHNjcmlwdD4=',
        width: 8,
        height: 8,
      }),
    ).toBeUndefined();
  });

  it.each([
    ['no measurements', { image: PIXEL }],
    ['a width of zero', { image: PIXEL, width: 0, height: 8 }],
    ['a fractional edge', { image: PIXEL, width: 8.5, height: 8 }],
    ['an edge beyond what can be drawn', { image: PIXEL, width: 99_999, height: 8 }],
    ['a missing drawing', { width: 8, height: 8 }],
    ['nothing at all', null],
    ['something that is not an answer', 'a drawing, honest'],
  ])('refuses an answer with %s rather than accepting it partially', (_, answer) => {
    expect(readSurfaceCapture(answer)).toBeUndefined();
  });
});

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

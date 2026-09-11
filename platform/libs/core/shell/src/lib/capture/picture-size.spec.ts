import { describe, expect, it } from 'vitest';
import { captureScale, scaleForSize } from './picture-size';

describe('captureScale', () => {
  it.each([
    [1, 1],
    [2, 2],
    [4, 4],
    [9, 4],
    [0.5, 0.5],
    [0.001, 0.05],
    [0, 1],
    [-2, 1],
    [NaN, 1],
    [Infinity, 1],
  ])('turns a ratio of %s into %s', (given, expected) => {
    expect(captureScale(given)).toBe(expected);
  });
});

describe('scaleForSize', () => {
  it('draws at the density of the screen when nothing is asked for', () => {
    expect(scaleForSize(undefined, 2, 1440)).toBe(2);
    expect(scaleForSize('screen', 2, 1440)).toBe(2);
  });

  it('draws plainer than the screen when asked to', () => {
    expect(scaleForSize('plain', 2, 1440)).toBe(1);
  });

  it('reaches below one picture pixel per CSS pixel for a narrow width', () => {
    expect(scaleForSize({ withinWidth: 600 }, 2, 1440)).toBeCloseTo(600 / 1440);
  });

  it('never enlarges for a width wider than the workbench', () => {
    expect(scaleForSize({ withinWidth: 4000 }, 2, 1440)).toBe(2);
  });

  it('answers a request beyond what it can draw with the nearest it can', () => {
    expect(scaleForSize('screen', 40, 1440)).toBe(4);
    expect(scaleForSize({ withinWidth: 1 }, 2, 1440)).toBe(0.05);
  });
});

import { describe, expect, it } from 'vitest';
import { effectivePadding } from './surface-padding';

describe('effectivePadding', () => {
  it('leaves a surface flush where nothing was declared and the product asks for nothing', () => {
    expect(effectivePadding(undefined, 'none')).toBe(false);
  });

  it('insets a surface where nothing was declared and the product asks for an inset', () => {
    expect(effectivePadding(undefined, 'inset')).toBe(true);
  });

  it('insets a surface that asks for it where the product asks for nothing', () => {
    expect(effectivePadding(true, 'none')).toBe(true);
  });

  it('leaves a surface flush that asks for it where the product asks for an inset', () => {
    expect(effectivePadding(false, 'inset')).toBe(false);
  });
});

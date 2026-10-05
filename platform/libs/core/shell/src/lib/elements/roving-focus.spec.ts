import { rovingStep } from './roving-focus';

describe('rovingStep', () => {
  it('walks along its axis and wraps at both ends', () => {
    expect(rovingStep('ArrowRight', 2, 3, 'horizontal')).toBe(0);
    expect(rovingStep('ArrowLeft', 0, 3, 'horizontal')).toBe(2);
    expect(rovingStep('ArrowDown', 1, 3, 'vertical')).toBe(2);
    expect(rovingStep('ArrowUp', 0, 3, 'vertical')).toBe(2);
  });

  it('starts from the near end when nothing is active yet', () => {
    expect(rovingStep('ArrowDown', -1, 4, 'vertical')).toBe(0);
    expect(rovingStep('ArrowUp', -1, 4, 'vertical')).toBe(3);
  });

  it('jumps to the ends, and ignores the other axis, other keys and an empty row', () => {
    expect(rovingStep('Home', 2, 4, 'vertical')).toBe(0);
    expect(rovingStep('End', 0, 4, 'horizontal')).toBe(3);
    expect(rovingStep('ArrowDown', 0, 4, 'horizontal')).toBeUndefined();
    expect(rovingStep('Enter', 0, 4, 'vertical')).toBeUndefined();
    expect(rovingStep('Home', 0, 0, 'vertical')).toBeUndefined();
  });
});

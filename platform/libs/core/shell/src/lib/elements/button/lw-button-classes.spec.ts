import { lwButtonClasses } from './lw-button-classes';

describe('lwButtonClasses (shared .lw-btn contract for the directive + element)', () => {
  it('emits the base + variant, with md as the default (no size modifier)', () => {
    expect(lwButtonClasses('default', 'md', false)).toEqual([
      'lw-btn',
      'lw-btn--default',
    ]);
    expect(lwButtonClasses('primary', 'md', false)).toEqual([
      'lw-btn',
      'lw-btn--primary',
    ]);
  });

  it('adds sm and icon modifiers', () => {
    expect(lwButtonClasses('ghost', 'sm', true)).toEqual([
      'lw-btn',
      'lw-btn--ghost',
      'lw-btn--sm',
      'lw-btn--icon',
    ]);
  });
});

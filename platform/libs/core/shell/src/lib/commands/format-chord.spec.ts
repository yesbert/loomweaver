import { formatChord } from './format-chord';

describe('formatChord', () => {
  const original = Object.getOwnPropertyDescriptor(navigator, 'platform');

  function setPlatform(value: string): void {
    Object.defineProperty(navigator, 'platform', {
      value,
      configurable: true,
    });
  }

  afterEach(() => {
    if (original) {
      Object.defineProperty(navigator, 'platform', original);
    }
  });

  it('stacks glyphs on macOS', () => {
    setPlatform('MacIntel');
    expect(formatChord('mod+k')).toBe('⌘K');
  });

  it('joins with "+" and spells modifiers elsewhere', () => {
    setPlatform('Win32');
    expect(formatChord('mod+k')).toBe('Ctrl+K');
  });
});

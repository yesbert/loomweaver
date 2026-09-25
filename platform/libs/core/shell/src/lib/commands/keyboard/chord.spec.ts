import {
  chordSignature,
  eventSignature,
  formatChordOn,
  isEditableTarget,
} from './chord';

describe('chordSignature', () => {
  it('resolves "mod" to meta on macOS and ctrl elsewhere', () => {
    expect(chordSignature('mod+shift+p', true)).toBe('meta+shift+p');
    expect(chordSignature('mod+shift+p', false)).toBe('ctrl+shift+p');
  });

  it('is case-insensitive and orders modifiers canonically (ctrl, meta, alt, shift, key)', () => {
    expect(chordSignature('Shift+Alt+Ctrl+K', false)).toBe('ctrl+alt+shift+k');
  });

  it('maps friendly aliases to the KeyboardEvent spelling', () => {
    expect(chordSignature('cmd+return', false)).toBe('meta+enter');
    expect(chordSignature('option+esc', false)).toBe('alt+escape');
    expect(chordSignature('ctrl+space', false)).toBe('ctrl+space');
  });

  it('returns null for a chord with no key', () => {
    expect(chordSignature('ctrl+shift', false)).toBeNull();
    expect(chordSignature('', false)).toBeNull();
  });
});

describe('eventSignature', () => {
  it('canonicalises a live keydown the same way', () => {
    expect(
      eventSignature(
        new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true }),
      ),
    ).toBe('ctrl+enter');
    expect(
      eventSignature(
        new KeyboardEvent('keydown', {
          key: 'K',
          metaKey: true,
          shiftKey: true,
        }),
      ),
    ).toBe('meta+shift+k');
  });

  it('matches a "mod" chord on the corresponding platform', () => {
    const event = new KeyboardEvent('keydown', { key: 'p', metaKey: true });
    expect(eventSignature(event)).toBe(chordSignature('mod+p', true));
  });

  it('uses the physical key so shift+digit matches despite the shifted symbol', () => {
    const event = new KeyboardEvent('keydown', {
      key: '!',
      code: 'Digit1',
      shiftKey: true,
    });
    expect(eventSignature(event)).toBe(chordSignature('shift+1', false));
  });

  it('uses the physical key so alt+letter matches despite a macOS dead char', () => {
    const event = new KeyboardEvent('keydown', {
      key: '˚',
      code: 'KeyK',
      altKey: true,
    });
    expect(eventSignature(event)).toBe(chordSignature('alt+k', false));
  });

  it('falls back to event.key for non-letter/digit keys', () => {
    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      ctrlKey: true,
    });
    expect(eventSignature(event)).toBe('ctrl+enter');
  });
});

describe('formatChordOn', () => {
  it('stacks glyphs on macOS and joins with "+" elsewhere', () => {
    expect(formatChordOn('mod+shift+p', true)).toBe('⌘⇧P');
    expect(formatChordOn('mod+shift+p', false)).toBe('Ctrl+Shift+P');
  });

  it('renders named keys and modifiers legibly', () => {
    expect(formatChordOn('mod+enter', true)).toBe('⌘↵');
    expect(formatChordOn('mod+enter', false)).toBe('Ctrl+Enter');
    expect(formatChordOn('alt+escape', false)).toBe('Alt+Esc');
  });
});

describe('isEditableTarget', () => {
  it('is true for text-editing elements, false otherwise', () => {
    expect(isEditableTarget(document.createElement('input'))).toBe(true);
    expect(isEditableTarget(document.createElement('textarea'))).toBe(true);
    expect(isEditableTarget(document.createElement('select'))).toBe(true);
    expect(isEditableTarget(document.createElement('div'))).toBe(false);
    expect(isEditableTarget(null)).toBe(false);
  });
});

describe('a chord alias', () => {
  const MODIFIER_ALIASES = [
    ['control', 'ctrl'],
    ['cmd', 'meta'],
    ['command', 'meta'],
    ['win', 'meta'],
    ['option', 'alt'],
  ] as const;
  const KEY_ALIASES = [
    ['esc', 'escape'],
    ['return', 'enter'],
    ['spacebar', 'space'],
  ] as const;

  it('is read the same way when it binds and when it is shown', () => {
    for (const isMac of [true, false]) {
      for (const [alias, canonical] of MODIFIER_ALIASES) {
        expect(chordSignature(`${alias}+k`, isMac)).toBe(
          chordSignature(`${canonical}+k`, isMac),
        );
        expect(formatChordOn(`${alias}+k`, isMac)).toBe(
          formatChordOn(`${canonical}+k`, isMac),
        );
      }
      for (const [alias, canonical] of KEY_ALIASES) {
        expect(chordSignature(`mod+${alias}`, isMac)).toBe(
          chordSignature(`mod+${canonical}`, isMac),
        );
        expect(formatChordOn(`mod+${alias}`, isMac)).toBe(
          formatChordOn(`mod+${canonical}`, isMac),
        );
      }
    }
  });
});

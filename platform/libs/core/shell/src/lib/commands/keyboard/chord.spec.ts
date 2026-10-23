import {
  ariaKeyShortcutsOn,
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

  it('resolves "del" to backspace on macOS and to delete elsewhere', () => {
    expect(chordSignature('mod+del', true)).toBe('meta+backspace');
    expect(chordSignature('mod+del', false)).toBe('ctrl+delete');
    expect(chordSignature('Del', true)).toBe('backspace');
  });

  it('keeps "delete" and "backspace" on their own keys on every platform', () => {
    for (const isMac of [true, false]) {
      expect(chordSignature('delete', isMac)).toBe('delete');
      expect(chordSignature('backspace', isMac)).toBe('backspace');
    }
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

  it("names the editing and paging keys the platform's way", () => {
    expect(formatChordOn('mod+delete', true)).toBe('⌘⌦');
    expect(formatChordOn('backspace', true)).toBe('⌫');
    expect(formatChordOn('mod+delete', false)).toBe('Ctrl+Del');
    expect(formatChordOn('pageup', false)).toBe('PgUp');
    expect(formatChordOn('insert', true)).toBe('Ins');
  });

  it('spells "del" as the key it stands for on the platform', () => {
    const german = (key: string) => ({ ctrl: 'Strg', delete: 'Entf' })[key];
    expect(formatChordOn('mod+del', true)).toBe('⌘⌫');
    expect(formatChordOn('mod+del', false)).toBe('Ctrl+Del');
    expect(formatChordOn('mod+del', false, german)).toBe('Strg+Entf');
  });

  it('takes a word for a key from the words it is given, and keeps symbols and arrows', () => {
    const german = (key: string) => ({ ctrl: 'Strg', delete: 'Entf' })[key];
    expect(formatChordOn('mod+delete', false, german)).toBe('Strg+Entf');
    expect(formatChordOn('mod+delete', true, german)).toBe('⌘⌦');
    expect(formatChordOn('alt+ArrowUp', false, german)).toBe('Alt+↑');
  });

  it('writes the arrow keys as arrows on every platform', () => {
    expect(formatChordOn('shift+ArrowUp', true)).toBe('⇧↑');
    expect(formatChordOn('shift+arrowdown', false)).toBe('Shift+↓');
    expect(formatChordOn('ArrowLeft', true)).toBe('←');
    expect(formatChordOn('ArrowRight', false)).toBe('→');
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

describe('ariaKeyShortcutsOn', () => {
  it('announces the neutral modifier as Meta on macOS and Control elsewhere', () => {
    expect(ariaKeyShortcutsOn('mod+k', true)).toBe('Meta+K');
    expect(ariaKeyShortcutsOn('mod+k', false)).toBe('Control+K');
  });

  it('announces the neutral delete key as the key it stands for', () => {
    expect(ariaKeyShortcutsOn('del', true)).toBe('Backspace');
    expect(ariaKeyShortcutsOn('mod+del', false)).toBe('Control+Delete');
  });

  it('names every modifier and a named key the way a key event does', () => {
    expect(ariaKeyShortcutsOn('ctrl+alt+shift+pageup', false)).toBe(
      'Control+Alt+Shift+PageUp',
    );
    expect(ariaKeyShortcutsOn('mod+arrowleft', true)).toBe('Meta+ArrowLeft');
    expect(ariaKeyShortcutsOn('shift+esc', false)).toBe('Shift+Escape');
  });

  it('announces nothing for a chord without a key', () => {
    expect(ariaKeyShortcutsOn('mod+shift', true)).toBeUndefined();
  });
});

interface ChordParts {
  ctrl: boolean;
  meta: boolean;
  alt: boolean;
  shift: boolean;
  key: string;
}

export function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }
  const platform = navigator.platform || navigator.userAgent || '';
  return /mac|iphone|ipad|ipod/i.test(platform);
}

function normaliseKey(key: string): string {
  const lower = key.toLowerCase();
  switch (lower) {
    case 'esc': {
      return 'escape';
    }
    case 'return': {
      return 'enter';
    }
    case 'space':
    case 'spacebar':
    case ' ': {
      return 'space';
    }
    default: {
      return lower;
    }
  }
}

function toSignature(parts: ChordParts): string {
  return [
    parts.ctrl ? 'ctrl' : '',
    parts.meta ? 'meta' : '',
    parts.alt ? 'alt' : '',
    parts.shift ? 'shift' : '',
    parts.key,
  ]
    .filter(Boolean)
    .join('+');
}

export function chordSignature(chord: string, isMac: boolean): string | null {
  const parts: ChordParts = {
    ctrl: false,
    meta: false,
    alt: false,
    shift: false,
    key: '',
  };
  for (const raw of chord.split('+')) {
    const token = raw.trim().toLowerCase();
    if (!token) {
      continue;
    }
    switch (token) {
      case 'mod': {
        if (isMac) parts.meta = true;
        else parts.ctrl = true;
        break;
      }
      case 'ctrl':
      case 'control': {
        parts.ctrl = true;
        break;
      }
      case 'meta':
      case 'cmd':
      case 'command':
      case 'win': {
        parts.meta = true;
        break;
      }
      case 'alt':
      case 'option': {
        parts.alt = true;
        break;
      }
      case 'shift': {
        parts.shift = true;
        break;
      }
      default: {
        parts.key = normaliseKey(token);
      }
    }
  }
  return parts.key ? toSignature(parts) : null;
}

export function formatShortcut(chord: string, isMac: boolean): string {
  const tokens = chord.split('+').map((raw) => {
    const token = raw.trim().toLowerCase();
    switch (token) {
      case 'mod': {
        return isMac ? '⌘' : 'Ctrl';
      }
      case 'ctrl':
      case 'control': {
        return isMac ? '⌃' : 'Ctrl';
      }
      case 'meta':
      case 'cmd':
      case 'command':
      case 'win': {
        return isMac ? '⌘' : 'Meta';
      }
      case 'alt':
      case 'option': {
        return isMac ? '⌥' : 'Alt';
      }
      case 'shift': {
        return isMac ? '⇧' : 'Shift';
      }
      case 'enter':
      case 'return': {
        return isMac ? '↵' : 'Enter';
      }
      case 'escape':
      case 'esc': {
        return 'Esc';
      }
      case 'space':
      case 'spacebar':
      case ' ': {
        return 'Space';
      }
      default: {
        return token.length === 1
          ? token.toUpperCase()
          : token.charAt(0).toUpperCase() + token.slice(1);
      }
    }
  });

  return tokens.join(isMac ? '' : '+');
}

function baseKeyFromCode(code: string): string | null {
  const letter = /^Key([A-Z])$/.exec(code);
  if (letter) {
    return letter[1].toLowerCase();
  }
  const digit = /^Digit(\d)$/.exec(code);
  return digit ? digit[1] : null;
}

export function eventSignature(event: KeyboardEvent): string {
  const key = baseKeyFromCode(event.code) ?? normaliseKey(event.key);
  return toSignature({
    ctrl: event.ctrlKey,
    meta: event.metaKey,
    alt: event.altKey,
    shift: event.shiftKey,
    key,
  });
}

export function isEditableTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (!element?.tagName) {
    return false;
  }
  const tag = element.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    element.isContentEditable === true
  );
}

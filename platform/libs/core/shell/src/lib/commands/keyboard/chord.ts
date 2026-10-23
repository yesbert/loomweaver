import { Command } from '@loomweaver/plugin-sdk';

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

const TOKEN_ALIASES: ReadonlyMap<string, string> = new Map([
  ['control', 'ctrl'],
  ['cmd', 'meta'],
  ['command', 'meta'],
  ['win', 'meta'],
  ['option', 'alt'],
  ['esc', 'escape'],
  ['return', 'enter'],
  ['spacebar', 'space'],
  [' ', 'space'],
]);

interface KeyLabel {
  readonly word: string;
  readonly symbol?: string;
  readonly everywhere?: boolean;
}

const KEY_LABELS: ReadonlyMap<string, KeyLabel> = new Map([
  ['mod', { word: 'Ctrl', symbol: '⌘' }],
  ['ctrl', { word: 'Ctrl', symbol: '⌃' }],
  ['meta', { word: 'Meta', symbol: '⌘' }],
  ['alt', { word: 'Alt', symbol: '⌥' }],
  ['shift', { word: 'Shift', symbol: '⇧' }],
  ['enter', { word: 'Enter', symbol: '↵' }],
  ['escape', { word: 'Esc' }],
  ['space', { word: 'Space' }],
  ['delete', { word: 'Del', symbol: '⌦' }],
  ['backspace', { word: 'Backspace', symbol: '⌫' }],
  ['tab', { word: 'Tab', symbol: '⇥' }],
  ['home', { word: 'Home', symbol: '↖' }],
  ['end', { word: 'End', symbol: '↘' }],
  ['pageup', { word: 'PgUp', symbol: '⇞' }],
  ['pagedown', { word: 'PgDn', symbol: '⇟' }],
  ['insert', { word: 'Ins' }],
  ['arrowup', { word: '↑', everywhere: true }],
  ['arrowdown', { word: '↓', everywhere: true }],
  ['arrowleft', { word: '←', everywhere: true }],
  ['arrowright', { word: '→', everywhere: true }],
]);

const WORD_OF: ReadonlyMap<string, string> = new Map([['mod', 'ctrl']]);

export type KeyWords = (key: string) => string | undefined;

type Modifier = 'ctrl' | 'meta' | 'alt' | 'shift';

const MODIFIERS: ReadonlySet<string> = new Set<Modifier>([
  'ctrl',
  'meta',
  'alt',
  'shift',
]);

function canonicalToken(token: string): string {
  const lower = token.toLowerCase();
  return TOKEN_ALIASES.get(lower) ?? lower;
}

function platformToken(token: string, isMac: boolean): string {
  const canonical = canonicalToken(token);
  if (canonical === 'del') {
    return isMac ? 'backspace' : 'delete';
  }
  return canonical;
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
    if (token) {
      applyToken(parts, token, isMac);
    }
  }
  return parts.key ? toSignature(parts) : null;
}

function applyToken(parts: ChordParts, token: string, isMac: boolean): void {
  const canonical = platformToken(token, isMac);
  if (canonical === 'mod') {
    parts[isMac ? 'meta' : 'ctrl'] = true;
    return;
  }
  if (MODIFIERS.has(canonical)) {
    parts[canonical as Modifier] = true;
    return;
  }
  parts.key = canonical;
}

export function formatChordOn(
  chord: string,
  isMac: boolean,
  words?: KeyWords,
): string {
  return chord
    .split('+')
    .map((raw) => tokenLabel(raw.trim(), isMac, words))
    .join(isMac ? '' : '+');
}

const ARIA_KEY_NAMES: ReadonlyMap<string, string> = new Map([
  ['ctrl', 'Control'],
  ['pageup', 'PageUp'],
  ['pagedown', 'PageDown'],
  ['arrowup', 'ArrowUp'],
  ['arrowdown', 'ArrowDown'],
  ['arrowleft', 'ArrowLeft'],
  ['arrowright', 'ArrowRight'],
]);

export function ariaKeyShortcutsOn(
  chord: string,
  isMac: boolean,
): string | undefined {
  const signature = chordSignature(chord, isMac);
  if (signature === null) {
    return undefined;
  }
  return signature
    .split('+')
    .map(
      (token) =>
        ARIA_KEY_NAMES.get(token) ??
        token.charAt(0).toUpperCase() + token.slice(1),
    )
    .join('+');
}

export function ariaKeyShortcuts(chord: string): string | undefined {
  return ariaKeyShortcutsOn(chord, isMacPlatform());
}

function tokenLabel(token: string, isMac: boolean, words?: KeyWords): string {
  const canonical = platformToken(token, isMac);
  const label = KEY_LABELS.get(canonical);
  if (label === undefined) {
    return canonical.charAt(0).toUpperCase() + canonical.slice(1);
  }
  if (label.everywhere) {
    return label.word;
  }
  if (isMac && label.symbol !== undefined) {
    return label.symbol;
  }
  return words?.(WORD_OF.get(canonical) ?? canonical) ?? label.word;
}

export interface ChordClaims {
  readonly bySignature: ReadonlyMap<string, readonly Command[]>;
  readonly unparsable: readonly Command[];
}

export function chordClaims(
  commands: readonly Command[],
  isMac: boolean,
): ChordClaims {
  const bySignature = new Map<string, Command[]>();
  const unparsable: Command[] = [];
  for (const command of commands) {
    if (!command.shortcut) {
      continue;
    }
    const signature = chordSignature(command.shortcut, isMac);
    if (signature === null) {
      unparsable.push(command);
      continue;
    }
    bySignature.set(signature, [
      ...(bySignature.get(signature) ?? []),
      command,
    ]);
  }
  return { bySignature, unparsable };
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
  const key = baseKeyFromCode(event.code) ?? canonicalToken(event.key);
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

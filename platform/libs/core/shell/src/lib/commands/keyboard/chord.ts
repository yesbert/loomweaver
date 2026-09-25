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

const TOKEN_LABELS: ReadonlyMap<
  string,
  { readonly mac: string; readonly other: string }
> = new Map([
  ['mod', { mac: '⌘', other: 'Ctrl' }],
  ['ctrl', { mac: '⌃', other: 'Ctrl' }],
  ['meta', { mac: '⌘', other: 'Meta' }],
  ['alt', { mac: '⌥', other: 'Alt' }],
  ['shift', { mac: '⇧', other: 'Shift' }],
  ['enter', { mac: '↵', other: 'Enter' }],
  ['escape', { mac: 'Esc', other: 'Esc' }],
  ['space', { mac: 'Space', other: 'Space' }],
]);

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
  const canonical = canonicalToken(token);
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

export function formatChordOn(chord: string, isMac: boolean): string {
  return chord
    .split('+')
    .map((raw) => tokenLabel(raw.trim(), isMac))
    .join(isMac ? '' : '+');
}

function tokenLabel(token: string, isMac: boolean): string {
  const canonical = canonicalToken(token);
  const label = TOKEN_LABELS.get(canonical);
  if (label !== undefined) {
    return isMac ? label.mac : label.other;
  }
  return canonical.charAt(0).toUpperCase() + canonical.slice(1);
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

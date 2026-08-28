import { formatShortcut, isMacPlatform } from './keybinding';

/**
 * Formats a keyboard chord for display, OS-correct: `formatChord('mod+k')` → `'⌘K'` on macOS,
 * `'Ctrl+K'` elsewhere. `mod` maps to ⌘/Ctrl, `alt` to ⌥/Alt, `shift` to ⇧/Shift, and so on — the
 * same token vocabulary a {@link Command.shortcut} uses. Lets a distribution or weaver show a
 * shortcut anywhere without duplicating the platform detection the shell already does internally.
 */
export function formatChord(chord: string): string {
  return formatShortcut(chord, isMacPlatform());
}

import { formatChordOn, isMacPlatform, KeyWords } from './chord';

let keyWords: KeyWords | undefined;

/**
 * Formats a keyboard chord for display, OS-correct: `formatChord('mod+k')` → `'⌘K'` on macOS,
 * `'Ctrl+K'` elsewhere. `mod` maps to ⌘/Ctrl, `alt` to ⌥/Alt, `shift` to ⇧/Shift, and so on — the
 * same token vocabulary a {@link Command.shortcut} uses. Named keys take the platform's symbol where
 * it has one (⌦ ⌫ ⇥ on macOS) and otherwise a word in the interface language once the shell is
 * running (`Strg+Entf` in German on Windows and Linux), so the result matches every hint the shell
 * draws; without a running shell the words are English. Lets a distribution or plugin show a
 * shortcut anywhere without duplicating the platform detection the shell already does internally.
 */
export function formatChord(chord: string): string {
  return formatChordOn(chord, isMacPlatform(), keyWords);
}

export function wordChordKeysWith(words: KeyWords | undefined): void {
  keyWords = words;
}

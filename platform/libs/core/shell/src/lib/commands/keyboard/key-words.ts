import { KeyWords } from './chord';

let inUse: KeyWords | undefined;

export function keyWordsInUse(): KeyWords | undefined {
  return inUse;
}

export function wordChordKeysWith(words: KeyWords | undefined): void {
  inUse = words;
}

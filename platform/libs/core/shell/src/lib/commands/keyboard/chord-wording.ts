import { DestroyRef, inject } from '@angular/core';
import { Wording } from '../../i18n/wording';
import { wordChordKeysWith } from './key-words';

export function wordChordKeys(): void {
  const wording = inject(Wording);
  wordChordKeysWith((key) => {
    const name = `keys.${key}`;
    const word = wording.translate(name);
    return word === name || word === '' ? undefined : word;
  });
  inject(DestroyRef).onDestroy(() => wordChordKeysWith(undefined));
}

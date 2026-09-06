import { inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@jsverse/transloco';
import { formatDate, formatQuantity } from '../accounting';
import { itemById } from './stock';

export function language() {
  const transloco = inject(TranslocoService);
  return toSignal(transloco.langChanges$, {
    initialValue: transloco.getActiveLang(),
  });
}

export function quantityIn(lang: () => string) {
  return (value: number) => formatQuantity(value, lang());
}

export function dateIn(lang: () => string) {
  return (iso: string) => formatDate(iso, lang());
}

export function itemLabelKey(id: string): string {
  return itemById(id)?.labelKey ?? id;
}

export function itemNumber(id: string): string {
  return itemById(id)?.number ?? id;
}

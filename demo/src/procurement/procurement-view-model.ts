import { inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@jsverse/transloco';
import { formatDate, formatMoney } from '../accounting';
import { supplierById } from './purchasing';

export function language() {
  const transloco = inject(TranslocoService);
  return toSignal(transloco.langChanges$, {
    initialValue: transloco.getActiveLang(),
  });
}

export function moneyIn(lang: () => string) {
  return (cents: number) => formatMoney(cents, lang());
}

export function dateIn(lang: () => string) {
  return (iso: string) => formatDate(iso, lang());
}

export function supplierName(id: string): string {
  return supplierById(id)?.name ?? id;
}

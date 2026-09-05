import { computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@jsverse/transloco';
import { customerById, formatDate, formatMoney } from '../accounting';

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

export function customerName(id: string): string {
  return customerById(id)?.name ?? id;
}

export function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

export function counted<T>(rows: () => readonly T[]) {
  return computed(() => rows().length);
}

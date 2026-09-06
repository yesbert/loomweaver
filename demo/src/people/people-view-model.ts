import { inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@jsverse/transloco';
import { formatDate, formatMoney } from '../accounting';

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

export function monthIn(lang: () => string) {
  return (month: string) =>
    new Intl.DateTimeFormat(lang() === 'de' ? 'de-DE' : 'en-GB', {
      month: 'long',
      year: 'numeric',
    }).format(new Date(`${month}-01T12:00:00Z`));
}

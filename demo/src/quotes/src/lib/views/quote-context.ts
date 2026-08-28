import { Signal, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { type Quote, quoteById } from '../../../../accounting';

export function quoteFromRoute(): Signal<Quote | undefined> {
  const route = inject(ActivatedRoute);
  const params = toSignal(route.paramMap);
  return computed(() => {
    const id = params()?.get('id');
    return id ? quoteById(id) : undefined;
  });
}

export function activeLang(): Signal<string> {
  const transloco = inject(TranslocoService);
  return toSignal(transloco.langChanges$, {
    initialValue: transloco.getActiveLang(),
  });
}

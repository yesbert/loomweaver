import { inject, Service } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@jsverse/transloco';
import { filter, merge, Observable, scan, skip } from 'rxjs';
import { holdsStrings } from './missing-translation-handler';

export function wordingChanges(
  transloco: TranslocoService,
): Observable<unknown> {
  return merge(
    transloco.langChanges$.pipe(
      skip(1),
      filter((lang) => holdsStrings(transloco, lang)),
    ),
    transloco.events$.pipe(
      filter(
        (event) =>
          event.type === 'translationLoadSuccess' &&
          event.payload.langName === transloco.getActiveLang(),
      ),
    ),
  );
}

@Service()
export class Wording {
  private readonly transloco = inject(TranslocoService);

  private readonly version = toSignal(
    wordingChanges(this.transloco).pipe(scan((count) => count + 1, 0)),
    { initialValue: 0 },
  );

  translate(key: string): string {
    this.version();
    return this.transloco.translate(key);
  }

  activeLang(): string {
    this.version();
    return this.transloco.getActiveLang();
  }
}

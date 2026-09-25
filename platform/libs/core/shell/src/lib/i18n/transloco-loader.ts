import { HttpClient } from '@angular/common/http';
import { inject, isDevMode, Service } from '@angular/core';
import { Translation, TranslocoLoader } from '@jsverse/transloco';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';
import { FALLBACK_LANGUAGE, SHIPPED_LANGUAGES } from './served-languages';
import { TRANSLATION_NAMESPACES } from './translation-namespaces';
import { TRANSLATION_OVERRIDES } from './translation-overrides';
import {
  hasKey,
  leafKeys,
  mergeTranslation,
  unknownOverrideKeys,
} from './translation-tree';

const MISSING_OVERLAY: Translation = {};

const MISSING_HOST: Translation = {};

@Service()
export class TranslocoHttpLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);
  private readonly namespaces = inject(TRANSLATION_NAMESPACES);
  private readonly overrides =
    inject(TRANSLATION_OVERRIDES, { optional: true }) ?? null;
  private readonly reported = new Set<string>();

  getTranslation(lang: string): ReturnType<TranslocoLoader['getTranslation']> {
    const host$ = this.hostStrings$(lang);
    if (this.namespaces.length === 0 && !this.overrides) {
      return host$;
    }
    return forkJoin({
      host: host$,
      namespaced: this.namespaced$(lang),
      overlay: this.overrides$(lang),
    }).pipe(
      map(({ host, namespaced, overlay }) =>
        this.applyOverrides({ ...host, ...namespaced }, overlay, lang),
      ),
    );
  }

  private namespaced$(lang: string): Observable<Translation> {
    if (this.namespaces.length === 0) {
      return of<Translation>({});
    }
    return forkJoin(
      Object.fromEntries(
        this.namespaces.map((name) => [name, this.namespace$(name, lang)]),
      ),
    );
  }

  private namespace$(name: string, lang: string): Observable<Translation> {
    return this.http.get<Translation>(`/i18n/${name}/${lang}.json`).pipe(
      catchError((error: unknown) => {
        this.warn(
          `Translation namespace "${name}" failed to load for "${lang}".`,
          error,
        );
        return of<Translation>({});
      }),
    );
  }

  private hostStrings$(lang: string): Observable<Translation> {
    const supplied$ = this.http.get<Translation>(`/i18n/${lang}.json`);
    if (SHIPPED_LANGUAGES.includes(lang)) {
      return supplied$;
    }
    return forkJoin([
      supplied$.pipe(catchError(() => of<Translation>(MISSING_HOST))),
      this.http.get<Translation>(`/i18n/${FALLBACK_LANGUAGE}.json`),
    ]).pipe(
      map(([supplied, fallback]) =>
        this.overFallback(lang, supplied, fallback),
      ),
    );
  }

  private overFallback(
    lang: string,
    supplied: Translation,
    fallback: Translation,
  ): Translation {
    if (supplied === MISSING_HOST) {
      this.reportOnce(
        lang,
        `No workbench strings for "${lang}" at /i18n/${lang}.json, so the workbench is shown in ` +
          `English while it is active.`,
      );
      return fallback;
    }
    const missing = leafKeys(fallback).filter(
      (path) => !hasKey(supplied, path),
    );
    if (missing.length > 0) {
      this.reportOnce(
        lang,
        `Workbench strings for "${lang}" lack ${missing.length} key(s), shown in English instead: ` +
          `${missing.join(', ')}.`,
      );
    }
    return mergeTranslation(fallback, supplied);
  }

  private reportOnce(lang: string, message: string): void {
    if (this.reported.has(lang)) {
      return;
    }
    this.reported.add(lang);
    this.warn(message);
  }

  private overrides$(lang: string): Observable<Translation> {
    if (!this.overrides) {
      return of<Translation>({});
    }
    return this.http
      .get<Translation>(`${this.overrides}/${lang}.json`)
      .pipe(catchError(() => of<Translation>(MISSING_OVERLAY)));
  }

  private applyOverrides(
    merged: Translation,
    overlay: Translation,
    lang: string,
  ): Translation {
    if (overlay === MISSING_OVERLAY) {
      this.warn(
        `No translation overrides for "${lang}" — its shipped strings are used unchanged.`,
      );
      return merged;
    }
    const unknown = unknownOverrideKeys(merged, overlay);
    if (unknown.length > 0) {
      this.warn(
        `Translation overrides for "${lang}" name ${unknown.length} key(s) nothing ships, ` +
          `so they will never appear: ${unknown.join(', ')}.`,
      );
    }
    return mergeTranslation(merged, overlay);
  }

  private warn(message: string, cause?: unknown): void {
    if (!isDevMode()) {
      return;
    }
    if (cause === undefined) {
      console.warn(message);
    } else {
      console.warn(message, cause);
    }
  }
}

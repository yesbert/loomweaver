import { APP_BASE_HREF } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Translation } from '@jsverse/transloco';
import { Observable } from 'rxjs';
import { provideTranslationNamespaces } from './translation-namespaces';
import { provideTranslationOverrides } from './translation-overrides';
import { TranslocoHttpLoader } from './transloco-loader';

function servedUnder(base: string, ...providers: Provider[]) {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: APP_BASE_HREF, useValue: base },
      ...providers,
    ],
  });
  const loader = TestBed.inject(TranslocoHttpLoader);
  const http = TestBed.inject(HttpTestingController);
  const load = (lang: string) =>
    (loader.getTranslation(lang) as Observable<Translation>).subscribe();
  return { http, load };
}

describe('translations of a distribution served under a path', () => {
  beforeEach(() =>
    vi.spyOn(console, 'warn').mockImplementation(() => undefined),
  );

  it("requests the workbench's strings under the base", () => {
    const { http, load } = servedUnder('/x/');
    load('de');

    expect(http.expectOne('/x/i18n/de.json').request.method).toBe('GET');
    http.verify();
  });

  it('requests each namespace under the base', () => {
    const { http, load } = servedUnder(
      '/x/',
      provideTranslationNamespaces('notes'),
    );
    load('en');

    expect(http.expectOne('/x/i18n/en.json').request.method).toBe('GET');
    expect(http.expectOne('/x/i18n/notes/en.json').request.method).toBe('GET');
    http.verify();
  });

  it('requests the English fallback of an unshipped language under the base', () => {
    const { http, load } = servedUnder('/x/');
    load('fr');

    expect(http.expectOne('/x/i18n/fr.json').request.method).toBe('GET');
    expect(http.expectOne('/x/i18n/en.json').request.method).toBe('GET');
    http.verify();
  });

  it('requests the default overlays under the base', () => {
    const { http, load } = servedUnder('/x/', provideTranslationOverrides());
    load('en');

    expect(http.expectOne('/x/i18n/en.json').request.method).toBe('GET');
    expect(http.expectOne('/x/i18n/overrides/en.json').request.method).toBe('GET');
    http.verify();
  });

  it('requests overlays from a directory named relative to the application under the base', () => {
    const { http, load } = servedUnder(
      '/x/',
      provideTranslationOverrides('brands/acme'),
    );
    load('en');

    expect(http.expectOne('/x/i18n/en.json').request.method).toBe('GET');
    expect(http.expectOne('/x/brands/acme/en.json').request.method).toBe('GET');
    http.verify();
  });

  it('requests overlays from a directory named from the origin as named', () => {
    const { http, load } = servedUnder(
      '/x/',
      provideTranslationOverrides('/shared/wording'),
    );
    load('en');

    expect(http.expectOne('/x/i18n/en.json').request.method).toBe('GET');
    expect(http.expectOne('/shared/wording/en.json').request.method).toBe('GET');
    http.verify();
  });

  it('requests exactly the addresses it always did at the root', () => {
    const { http, load } = servedUnder(
      '/',
      provideTranslationNamespaces('notes'),
      provideTranslationOverrides(),
    );
    load('en');

    expect(http.expectOne('/i18n/en.json').request.method).toBe('GET');
    expect(http.expectOne('/i18n/notes/en.json').request.method).toBe('GET');
    expect(http.expectOne('/i18n/overrides/en.json').request.method).toBe('GET');
    http.verify();
  });
});

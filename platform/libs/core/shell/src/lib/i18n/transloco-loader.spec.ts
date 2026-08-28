import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import {
  TRANSLATION_NAMESPACES,
  TranslocoHttpLoader,
  provideTranslationNamespaces,
  provideTranslationOverrides,
} from './transloco-loader';

function setup(
  namespaces?: string[],
  overrides: boolean | string = false,
) {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      ...(namespaces ? [provideTranslationNamespaces(...namespaces)] : []),
      ...(overrides
        ? [
            typeof overrides === 'string'
              ? provideTranslationOverrides(overrides)
              : provideTranslationOverrides(),
          ]
        : []),
    ],
  });
  return {
    loader: TestBed.inject(TranslocoHttpLoader),
    http: TestBed.inject(HttpTestingController),
  };
}

describe('TranslocoHttpLoader', () => {
  it('loads only the host translations when no namespace is registered', async () => {
    const { loader, http } = setup();
    const result = loader.getTranslation('en');
    const promise =
      result instanceof Promise
        ? result
        : new Promise((r) => result.subscribe(r));

    http.expectOne('/i18n/en.json').flush({ dialog: { ok: 'OK' } });
    http.expectNone('/i18n/weaver/en.json');
    await expect(promise).resolves.toEqual({ dialog: { ok: 'OK' } });
    http.verify();
  });

  it('nests each registered namespace under its key so it cannot collide with host keys', async () => {
    const { loader, http } = setup(['weaver', 'product']);
    const result = loader.getTranslation('en');
    const promise = new Promise((r) =>
      (result as { subscribe: (f: unknown) => void }).subscribe(r),
    );

    http.expectOne('/i18n/en.json').flush({ dialog: { ok: 'OK' } });
    http.expectOne('/i18n/weaver/en.json').flush({ nav: { title: 'Navigator' } });
    http
      .expectOne('/i18n/product/en.json')
      .flush({ tagline: 'Weave documents & knowledge' });

    await expect(promise).resolves.toEqual({
      dialog: { ok: 'OK' },
      weaver: { nav: { title: 'Navigator' } },
      product: { tagline: 'Weave documents & knowledge' },
    });
    http.verify();
  });

  it('keeps host + other namespaces when one namespace fails to load', async () => {
    const warn = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);
    const { loader, http } = setup(['weaver', 'product']);
    const result = loader.getTranslation('en');
    const promise = new Promise((r) =>
      (result as { subscribe: (f: unknown) => void }).subscribe(r),
    );

    http.expectOne('/i18n/en.json').flush({ dialog: { ok: 'OK' } });
    http.expectOne('/i18n/weaver/en.json').flush({ nav: { title: 'Navigator' } });
    http
      .expectOne('/i18n/product/en.json')
      .flush('not found', { status: 404, statusText: 'Not Found' });

    await expect(promise).resolves.toEqual({
      dialog: { ok: 'OK' },
      weaver: { nav: { title: 'Navigator' } },
      product: {},
    });
    expect(warn).toHaveBeenCalled();
    http.verify();
    warn.mockRestore();
  });

  it('exposes the registered namespaces via the token', () => {
    setup(['weaver', 'product']);
    expect(TestBed.inject(TRANSLATION_NAMESPACES)).toEqual(['weaver', 'product']);
  });

  it('asks for no overlay unless the distribution opted in', async () => {
    const { loader, http } = setup();
    const result = loader.getTranslation('en');
    const promise = new Promise((r) =>
      (result as { subscribe: (f: unknown) => void }).subscribe(r),
    );

    http.expectOne('/i18n/en.json').flush({ dialog: { ok: 'OK' } });
    http.expectNone('/i18n/overrides/en.json');
    await promise;
    http.verify();
  });

  it('replaces the named keys and keeps every sibling, including a later release’s', async () => {
    const { loader, http } = setup(undefined, true);
    const result = loader.getTranslation('en');
    const promise = new Promise((r) =>
      (result as { subscribe: (f: unknown) => void }).subscribe(r),
    );

    http
      .expectOne('/i18n/en.json')
      .flush({ workspace: { saveAs: 'Save as new', reset: 'Reset' } });
    http
      .expectOne('/i18n/overrides/en.json')
      .flush({ workspace: { saveAs: 'Save as' } });

    await expect(promise).resolves.toEqual({
      workspace: { saveAs: 'Save as', reset: 'Reset' },
    });
    http.verify();
  });

  it('reaches a bundled weaver’s strings too, because it is applied last', async () => {
    const { loader, http } = setup(['weaver'], true);
    const result = loader.getTranslation('en');
    const promise = new Promise((r) =>
      (result as { subscribe: (f: unknown) => void }).subscribe(r),
    );

    http.expectOne('/i18n/en.json').flush({ dialog: { ok: 'OK' } });
    http
      .expectOne('/i18n/weaver/en.json')
      .flush({ nav: { title: 'Navigator' } });
    http
      .expectOne('/i18n/overrides/en.json')
      .flush({ weaver: { nav: { title: 'Explorer' } } });

    await expect(promise).resolves.toEqual({
      dialog: { ok: 'OK' },
      weaver: { nav: { title: 'Explorer' } },
    });
    http.verify();
  });

  it('keeps the shipped strings when a language has no overlay', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { loader, http } = setup(undefined, true);
    const result = loader.getTranslation('en');
    const promise = new Promise((r) =>
      (result as { subscribe: (f: unknown) => void }).subscribe(r),
    );

    http.expectOne('/i18n/en.json').flush({ dialog: { ok: 'OK' } });
    http
      .expectOne('/i18n/overrides/en.json')
      .flush('not found', { status: 404, statusText: 'Not Found' });

    await expect(promise).resolves.toEqual({ dialog: { ok: 'OK' } });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('unchanged'));
    http.verify();
    warn.mockRestore();
  });

  it('names an override key nothing ships, which would otherwise never appear', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { loader, http } = setup(undefined, true);
    const result = loader.getTranslation('en');
    const promise = new Promise((r) =>
      (result as { subscribe: (f: unknown) => void }).subscribe(r),
    );

    http.expectOne('/i18n/en.json').flush({ workspace: { saveAs: 'Save as new' } });
    http
      .expectOne('/i18n/overrides/en.json')
      .flush({ workspace: { saveAsNew: 'Save as' } });

    await promise;
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('workspace.saveAsNew'),
    );
    http.verify();
    warn.mockRestore();
  });

  it('loads the overlay from the directory the distribution named', async () => {
    const { loader, http } = setup(undefined, '/i18n/overrides/acme');
    const result = loader.getTranslation('de');
    const promise = new Promise((r) =>
      (result as { subscribe: (f: unknown) => void }).subscribe(r),
    );

    http
      .expectOne('/i18n/de.json')
      .flush({ workspace: { title: 'Workspaces' } });
    http.expectNone('/i18n/overrides/de.json');
    http
      .expectOne('/i18n/overrides/acme/de.json')
      .flush({ workspace: { title: 'Ablagen' } });

    await expect(promise).resolves.toEqual({
      workspace: { title: 'Ablagen' },
    });
    http.verify();
  });

  it('accepts a trailing slash rather than fetching a doubled path', async () => {
    const { loader, http } = setup(undefined, '/i18n/overrides/acme/');
    const result = loader.getTranslation('de');
    const promise = new Promise((r) =>
      (result as { subscribe: (f: unknown) => void }).subscribe(r),
    );

    http.expectOne('/i18n/de.json').flush({ dialog: { ok: 'OK' } });
    http
      .expectOne('/i18n/overrides/acme/de.json')
      .flush({ dialog: { ok: 'Gut' } });

    await expect(promise).resolves.toEqual({ dialog: { ok: 'Gut' } });
    http.verify();
  });

  it('rejects a path that would silently fetch the host bundle as its own overlay', () => {
    expect(() => provideTranslationOverrides('/')).toThrow(
      /needs a directory/,
    );
  });
});

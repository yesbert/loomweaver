import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import {
  TranslocoHttpLoader,
  provideTranslationNamespaces,
  provideTranslationOverrides,
} from './transloco-loader';

const NOT_FOUND = { status: 404, statusText: 'Not Found' };

function setup(...extra: unknown[]) {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), ...(extra as [])],
  });
  return {
    loader: TestBed.inject(TranslocoHttpLoader),
    http: TestBed.inject(HttpTestingController),
  };
}

function load(loader: TranslocoHttpLoader, lang: string): Promise<unknown> {
  const result = loader.getTranslation(lang);
  return result instanceof Promise
    ? result
    : new Promise((resolve) =>
        (result as { subscribe: (next: unknown) => void }).subscribe(resolve),
      );
}

describe('workbench strings for a language the workbench does not ship', () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => warn.mockRestore());

  it('loads a shipped language exactly as before, with no English base', async () => {
    const { loader, http } = setup();
    const promise = load(loader, 'de');

    http.expectOne('/i18n/de.json').flush({ dialog: { ok: 'Gut' } });
    http.expectNone('/i18n/en.json');

    await expect(promise).resolves.toEqual({ dialog: { ok: 'Gut' } });
    expect(warn).not.toHaveBeenCalled();
    http.verify();
  });

  it('shows the strings a product supplies and English for the rest, naming what is missing', async () => {
    const { loader, http } = setup();
    const promise = load(loader, 'fr');

    http.expectOne('/i18n/fr.json').flush({ dialog: { ok: "D'accord" } });
    http
      .expectOne('/i18n/en.json')
      .flush({ dialog: { ok: 'OK', cancel: 'Cancel' }, workspace: { reset: 'Reset' } });

    await expect(promise).resolves.toEqual({
      dialog: { ok: "D'accord", cancel: 'Cancel' },
      workspace: { reset: 'Reset' },
    });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"fr"'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('dialog.cancel'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('workspace.reset'));
    http.verify();
  });

  it('serves a language with no workbench strings in English, says so once, and does not fail', async () => {
    const { loader, http } = setup();

    const first = load(loader, 'fr');
    http.expectOne('/i18n/fr.json').flush('not found', NOT_FOUND);
    http.expectOne('/i18n/en.json').flush({ dialog: { ok: 'OK' } });
    await expect(first).resolves.toEqual({ dialog: { ok: 'OK' } });

    const second = load(loader, 'fr');
    http.expectOne('/i18n/fr.json').flush('not found', NOT_FOUND);
    http.expectOne('/i18n/en.json').flush({ dialog: { ok: 'OK' } });
    await expect(second).resolves.toEqual({ dialog: { ok: 'OK' } });

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('No workbench strings'));
    http.verify();
  });

  it('still applies named bundles and the overlay on top', async () => {
    const { loader, http } = setup(
      provideTranslationNamespaces('weaver'),
      provideTranslationOverrides(),
    );
    const promise = load(loader, 'fr');

    http.expectOne('/i18n/fr.json').flush({ dialog: { ok: "D'accord" } });
    http.expectOne('/i18n/en.json').flush({ dialog: { ok: 'OK' } });
    http.expectOne('/i18n/weaver/fr.json').flush({ nav: { title: 'Navigateur' } });
    http.expectOne('/i18n/overrides/fr.json').flush({ dialog: { ok: 'Bien' } });

    await expect(promise).resolves.toEqual({
      dialog: { ok: 'Bien' },
      weaver: { nav: { title: 'Navigateur' } },
    });
    http.verify();
  });
});

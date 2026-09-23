import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { LanguageSwitcher } from './language-switcher';
import { LocaleService } from './locale.service';
import { languageName, SHIPPED_LANGUAGES } from './served-languages';
import { ViewportService } from '../layout/viewport.service';

function render(served: readonly string[], compact = false): HTMLElement {
  TestBed.configureTestingModule({
    imports: [
      LanguageSwitcher,
      TranslocoTestingModule.forRoot({
        langs: { en: { language: { label: 'Language' } } },
        translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
        preloadLangs: true,
      }),
    ],
    providers: [
      {
        provide: LocaleService,
        useValue: {
          lang: signal('en'),
          supported: served,
          languages: served.map((code) => ({ code, name: languageName(code) })),
          setLang: () => undefined,
        },
      },
      { provide: ViewportService, useValue: { compact: signal(compact) } },
    ],
  });
  const fixture = TestBed.createComponent(LanguageSwitcher);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

function options(served: readonly string[]) {
  return [...render(served).querySelectorAll('lw-option')].map((option) => ({
    value: option.getAttribute('value'),
    icon: option.getAttribute('icon'),
    label: option.textContent?.trim(),
  }));
}

describe('LanguageSwitcher', () => {
  it('offers the languages the workbench serves and no others', () => {
    expect(options(SHIPPED_LANGUAGES).map((option) => option.value)).toEqual([
      ...SHIPPED_LANGUAGES,
    ]);
  });

  it('takes the compact form on a narrow viewport', () => {
    expect(
      render(SHIPPED_LANGUAGES, true)
        .querySelector('lw-select')
        ?.hasAttribute('compact'),
    ).toBe(true);
  });

  it('keeps the full form on a wide viewport', () => {
    expect(
      render(SHIPPED_LANGUAGES, false)
        .querySelector('lw-select')
        ?.hasAttribute('compact'),
    ).toBe(false);
  });

  it('offers a further served language without a second list being edited', () => {
    expect(options([...SHIPPED_LANGUAGES, 'fr']).map((option) => option.value)).toEqual([
      ...SHIPPED_LANGUAGES,
      'fr',
    ]);
  });

  it('keeps English and German exactly as they look today', () => {
    expect(options(SHIPPED_LANGUAGES)).toEqual([
      { value: 'en', icon: '🇬🇧', label: 'English' },
      { value: 'de', icon: '🇩🇪', label: 'Deutsch' },
    ]);
  });

  it('names a language it has no flag for in that language, with its code as the symbol', () => {
    expect(options(['en', 'fr'])[1]).toEqual({
      value: 'fr',
      icon: 'FR',
      label: 'Français',
    });
  });
});

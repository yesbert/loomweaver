import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { LanguageSwitcher } from './language-switcher';
import { LocaleService, SUPPORTED_LANGS } from './locale.service';
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

function offeredLangs(served: readonly string[]): readonly (string | null)[] {
  return [...render(served).querySelectorAll('lw-option')].map((option) =>
    option.getAttribute('value'),
  );
}

describe('LanguageSwitcher', () => {
  it('offers the languages the workbench serves and no others', () => {
    expect(offeredLangs(SUPPORTED_LANGS)).toEqual([...SUPPORTED_LANGS]);
  });

  it('takes the compact form on a narrow viewport', () => {
    expect(
      render(SUPPORTED_LANGS, true)
        .querySelector('lw-select')
        ?.hasAttribute('compact'),
    ).toBe(true);
  });

  it('keeps the full form on a wide viewport', () => {
    expect(
      render(SUPPORTED_LANGS, false)
        .querySelector('lw-select')
        ?.hasAttribute('compact'),
    ).toBe(false);
  });

  it('offers a further served language without a second list being edited', () => {
    expect(offeredLangs([...SUPPORTED_LANGS, 'fr'])).toEqual([
      ...SUPPORTED_LANGS,
      'fr',
    ]);
  });
});

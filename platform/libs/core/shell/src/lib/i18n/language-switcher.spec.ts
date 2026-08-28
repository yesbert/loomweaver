import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { LanguageSwitcher } from './language-switcher';
import { LocaleService, SUPPORTED_LANGS } from './locale.service';

function offeredLangs(served: readonly string[]): readonly (string | null)[] {
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
    ],
  });
  const fixture = TestBed.createComponent(LanguageSwitcher);
  fixture.detectChanges();
  const host = fixture.nativeElement as HTMLElement;
  return [...host.querySelectorAll('lw-option')].map((option) =>
    option.getAttribute('value'),
  );
}

describe('LanguageSwitcher', () => {
  it('offers the languages the workbench serves and no others', () => {
    expect(offeredLangs(SUPPORTED_LANGS)).toEqual([...SUPPORTED_LANGS]);
  });

  it('offers a further served language without a second list being edited', () => {
    expect(offeredLangs([...SUPPORTED_LANGS, 'fr'])).toEqual([
      ...SUPPORTED_LANGS,
      'fr',
    ]);
  });
});

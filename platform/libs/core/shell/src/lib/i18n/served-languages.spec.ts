import {
  detectInitialLang,
  resolveServedLanguages,
  SHIPPED_LANGUAGES,
} from './served-languages';

function preferring(...languages: string[]): void {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(languages);
}

describe('the languages a distribution serves', () => {
  it('are the shipped languages when nothing is declared', () => {
    expect(resolveServedLanguages(undefined)).toEqual(['en', 'de']);
    expect(SHIPPED_LANGUAGES).toEqual(['en', 'de']);
  });

  it('can add a language the workbench does not ship', () => {
    expect(resolveServedLanguages(['en', 'de', 'fr'])).toEqual(['en', 'de', 'fr']);
  });

  it('can leave a shipped language out, or both', () => {
    expect(resolveServedLanguages(['en'])).toEqual(['en']);
    expect(resolveServedLanguages(['fr', 'ja'])).toEqual(['fr', 'ja']);
  });

  it('are canonical, and a language declared twice is served once', () => {
    expect(resolveServedLanguages(['pt-br', 'PT-BR', 'fr'])).toEqual(['pt-BR', 'fr']);
  });

  it('refuse an empty declaration', () => {
    expect(() => resolveServedLanguages([])).toThrow(/at least one language/);
  });

  it('refuse something that is not a language code, naming it', () => {
    expect(() => resolveServedLanguages(['en', 'not a language'])).toThrow(
      /not a language/,
    );
  });
});

describe('the starting language', () => {
  beforeEach(() => {
    localStorage.clear();
    preferring();
  });

  afterEach(() => vi.restoreAllMocks());

  it('is a stored choice that is still served', () => {
    localStorage.setItem('lw.shell.lang', 'fr');
    preferring('de');

    expect(detectInitialLang(['en', 'de', 'fr'])).toBe('fr');
  });

  it('ignores a stored choice the declaration no longer serves', () => {
    localStorage.setItem('lw.shell.lang', 'de');
    preferring('fr');

    expect(detectInitialLang(['en', 'fr'])).toBe('fr');
  });

  it('takes the first browser preference that names a served language exactly', () => {
    preferring('ja', 'pt-BR', 'fr');

    expect(detectInitialLang(['fr', 'pt-BR'])).toBe('pt-BR');
  });

  it('matches a regional preference to its served language without a region', () => {
    preferring('de-AT');

    expect(detectInitialLang(['en', 'de'])).toBe('de');
  });

  it('does not match a region-less preference to a served regional form', () => {
    preferring('pt');

    expect(detectInitialLang(['en', 'pt-BR'])).toBe('en');
  });

  it('falls back to English where it is served', () => {
    preferring('ja');

    expect(detectInitialLang(['de', 'en'])).toBe('en');
  });

  it('falls back to the first declared language where English is not served', () => {
    preferring('ja');

    expect(detectInitialLang(['fr', 'de'])).toBe('fr');
  });
});

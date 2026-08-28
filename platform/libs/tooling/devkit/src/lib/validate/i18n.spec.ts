import { validateI18nParity } from './i18n';

describe('validateI18nParity', () => {
  it('passes when languages share the same keys', () => {
    expect(
      validateI18nParity({
        en: { title: 'Notes', nav: { home: 'Home' } },
        de: { title: 'Notizen', nav: { home: 'Start' } },
      }),
    ).toEqual([]);
  });

  it('flags a key missing in one language', () => {
    const findings = validateI18nParity({
      en: { title: 'Notes', subtitle: 'Scratch' },
      de: { title: 'Notizen' },
    });
    expect(findings).toHaveLength(1);
    expect(findings[0].code).toBe('i18n.missingKey');
    expect(findings[0].message).toContain('subtitle');
    expect(findings[0].path).toBe('i18n/de');
  });

  it('is a no-op for a single language', () => {
    expect(validateI18nParity({ en: { title: 'Notes' } })).toEqual([]);
  });
});

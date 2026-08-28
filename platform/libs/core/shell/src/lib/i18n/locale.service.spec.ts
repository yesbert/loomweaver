import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { TranslocoService } from '@jsverse/transloco';
import { detectInitialLang, LocaleService } from './locale.service';
import { SETTINGS_STORE } from '../persistence/settings-store';

describe('LocaleService', () => {
  function setup() {
    const setActiveLang = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: TranslocoService, useValue: { setActiveLang } }],
    });
    return {
      service: TestBed.inject(LocaleService),
      doc: TestBed.inject(DOCUMENT),
      setActiveLang,
    };
  }

  it('setLang updates the signal, transloco, storage and the document language', () => {
    localStorage.clear();
    const { service, doc, setActiveLang } = setup();

    service.setLang('de');

    expect(service.lang()).toBe('de');
    expect(setActiveLang).toHaveBeenCalledWith('de');
    expect(localStorage.getItem('lw.shell.lang')).toBe('de');
    expect(doc.documentElement.lang).toBe('de');
  });

  it('applies an async-hydrated language without writing it back to the store', async () => {
    localStorage.clear();
    const set = vi.fn(() => Promise.resolve());
    TestBed.configureTestingModule({
      providers: [
        { provide: TranslocoService, useValue: { setActiveLang: vi.fn() } },
        {
          provide: SETTINGS_STORE,
          useValue: {
            get: () => Promise.resolve('de'),
            set,
            delete: () => Promise.resolve(),
          },
        },
      ],
    });
    const service = TestBed.inject(LocaleService);
    await Promise.resolve();
    await Promise.resolve();

    expect(service.lang()).toBe('de');
    expect(set).not.toHaveBeenCalled();
  });
});

describe('detectInitialLang', () => {
  beforeEach(() => localStorage.clear());

  it('returns a persisted supported language', () => {
    localStorage.setItem('lw.shell.lang', 'de');
    expect(detectInitialLang()).toBe('de');
  });

  it('ignores an unsupported persisted value', () => {
    localStorage.setItem('lw.shell.lang', 'xx');
    expect(['en', 'de']).toContain(detectInitialLang());
  });

  it('falls back to en when nothing matches', () => {
    expect(detectInitialLang()).toBe('en');
  });
});

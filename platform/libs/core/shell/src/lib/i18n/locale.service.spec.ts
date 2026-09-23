import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import {
  provideTransloco,
  Translation,
  TranslocoLoader,
  TranslocoService,
} from '@jsverse/transloco';
import {
  EMPTY,
  firstValueFrom,
  NEVER,
  Observable,
  of,
  Subject,
  throwError,
} from 'rxjs';
import { LocaleService } from './locale.service';
import { SERVED_LANGUAGES } from './served-languages';
import { SETTINGS_STORE } from '../persistence/settings-store';

describe('LocaleService', () => {
  function setup() {
    const setActiveLang = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: TranslocoService,
          useValue: { setActiveLang, load: () => of({}) },
        },
      ],
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
        {
          provide: TranslocoService,
          useValue: { setActiveLang: vi.fn(), load: () => of({}) },
        },
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

describe('LocaleService as a product reads and drives it', () => {
  function serving(languages: readonly string[]) {
    localStorage.clear();
    const setActiveLang = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: TranslocoService,
          useValue: { setActiveLang, load: () => of({}) },
        },
        { provide: SERVED_LANGUAGES, useValue: languages },
      ],
    });
    return { service: TestBed.inject(LocaleService), setActiveLang };
  }

  it('names each served language in that language', () => {
    const { service } = serving(['en', 'de', 'fr']);

    expect(service.languages).toEqual([
      { code: 'en', name: 'English' },
      { code: 'de', name: 'Deutsch' },
      { code: 'fr', name: 'Français' },
    ]);
  });

  it('shows the code where no name can be derived', () => {
    const { service } = serving(['en', 'qaa']);

    expect(service.languages[1]).toEqual({ code: 'qaa', name: 'qaa' });
  });

  it('refuses a language that is not served, keeping the active one and telling the developer', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { service, setActiveLang } = serving(['en', 'fr']);
    const before = service.lang();

    service.setLang('it');

    expect(service.lang()).toBe(before);
    expect(setActiveLang).not.toHaveBeenCalled();
    expect(localStorage.getItem('lw.shell.lang')).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"it"'));
    warn.mockRestore();
  });
});

describe('LocaleService switching to a language not loaded yet', () => {
  function loading(
    load: (lang: string) => Observable<unknown>,
    store?: { get: () => Promise<string | undefined> },
  ) {
    localStorage.clear();
    let active = 'en';
    const setActiveLang = vi.fn((lang: string) => {
      active = lang;
    });
    TestBed.configureTestingModule({
      providers: [
        {
          provide: TranslocoService,
          useValue: { setActiveLang, load, getActiveLang: () => active },
        },
        ...(store
          ? [
              {
                provide: SETTINGS_STORE,
                useValue: {
                  ...store,
                  set: () => Promise.resolve(),
                  delete: () => Promise.resolve(),
                },
              },
            ]
          : []),
      ],
    });
    return {
      service: TestBed.inject(LocaleService),
      doc: TestBed.inject(DOCUMENT),
      setActiveLang,
    };
  }

  let warn: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => {
    warn.mockRestore();
    vi.useRealTimers();
  });

  it('keeps the previous language until the strings are there, then switches and remembers as one act', () => {
    const arrived = new Subject<object>();
    const { service, doc, setActiveLang } = loading(() => arrived);
    const before = service.lang();

    service.setLang('de');

    expect(service.lang()).toBe(before);
    expect(setActiveLang).not.toHaveBeenCalled();
    expect(localStorage.getItem('lw.shell.lang')).toBeNull();

    arrived.next({});

    expect(service.lang()).toBe('de');
    expect(setActiveLang).toHaveBeenCalledWith('de');
    expect(doc.documentElement.lang).toBe('de');
    expect(localStorage.getItem('lw.shell.lang')).toBe('de');
  });

  it('stays in the active language and stores nothing when the strings cannot be loaded', () => {
    const { service, setActiveLang } = loading(() =>
      throwError(() => new Error('offline')),
    );

    service.setLang('de');

    expect(service.lang()).toBe('en');
    expect(setActiveLang).not.toHaveBeenCalledWith('de');
    expect(localStorage.getItem('lw.shell.lang')).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"de"'));
  });

  it('stays in the active language when the load ends without delivering anything', () => {
    const { service, setActiveLang } = loading(() => EMPTY);

    service.setLang('de');

    expect(service.lang()).toBe('en');
    expect(setActiveLang).not.toHaveBeenCalledWith('de');
    expect(localStorage.getItem('lw.shell.lang')).toBeNull();
  });

  it('stays in the active language when the strings do not arrive within the bound', () => {
    vi.useFakeTimers();
    const { service } = loading(() => NEVER);

    service.setLang('de');
    vi.advanceTimersByTime(10_000);

    expect(service.lang()).toBe('en');
    expect(localStorage.getItem('lw.shell.lang')).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"de"'));
  });

  it('applies only the latest of two choices made while loading', () => {
    const loads = new Map<string, Subject<object>>();
    const { service, setActiveLang } = loading((lang) => {
      const subject = new Subject<object>();
      loads.set(lang, subject);
      return subject;
    });

    service.setLang('de');
    service.setLang('en');
    loads.get('de')?.next({});
    loads.get('en')?.next({});

    expect(setActiveLang).toHaveBeenCalledTimes(1);
    expect(setActiveLang).toHaveBeenCalledWith('en');
    expect(service.lang()).toBe('en');
  });

  it('does not let a stored value that changes nothing cancel a choice still loading', async () => {
    let answer: (value: string) => void = () => undefined;
    const arrived = new Subject<object>();
    const { service } = loading(() => arrived, {
      get: () => new Promise<string>((resolve) => (answer = resolve)),
    });

    service.setLang('de');
    answer('en');
    await Promise.resolve();
    await Promise.resolve();
    arrived.next({});

    expect(service.lang()).toBe('de');
  });
});

@Injectable()
class GermanUnreachable implements TranslocoLoader {
  getTranslation(lang: string): Observable<Translation> {
    return lang === 'de'
      ? throwError(() => new Error('offline'))
      : of({ greeting: lang === 'fr' ? 'Bonjour' : 'Hello' });
  }
}

describe('LocaleService with the translation library itself', () => {
  it('stays in the active language when its strings cannot be loaded, although the library falls back', async () => {
    localStorage.clear();
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    TestBed.configureTestingModule({
      providers: [
        { provide: SERVED_LANGUAGES, useValue: ['en', 'de', 'fr'] },
        provideTransloco({
          config: {
            availableLangs: ['en', 'de', 'fr'],
            defaultLang: 'en',
            fallbackLang: 'en',
            failedRetries: 0,
            missingHandler: { logMissingKey: false },
          },
          loader: GermanUnreachable,
        }),
      ],
    });
    const transloco = TestBed.inject(TranslocoService);
    await firstValueFrom(transloco.load('en'));
    const service = TestBed.inject(LocaleService);
    service.setLang('fr');
    await Promise.resolve();
    expect(service.lang()).toBe('fr');

    service.setLang('de');
    await Promise.resolve();

    expect(service.lang()).toBe('fr');
    expect(transloco.getActiveLang()).toBe('fr');
    expect(localStorage.getItem('lw.shell.lang')).toBe('fr');
    error.mockRestore();
    warn.mockRestore();
  });
});

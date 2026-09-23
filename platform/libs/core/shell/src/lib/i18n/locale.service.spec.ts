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
  BehaviorSubject,
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
import { StateSyncService } from '../persistence/state-sync.service';

function fakeTransloco(
  load: (lang: string) => Observable<unknown> = () => of({}),
  holdsStrings: (lang: string) => boolean = () => true,
  initial = 'en',
) {
  const active = new BehaviorSubject(initial);
  const setActiveLang = vi.fn((lang: string) => active.next(lang));
  return {
    setActiveLang,
    fallBackTo: (lang: string) => active.next(lang),
    useValue: {
      setActiveLang,
      load,
      getActiveLang: () => active.value,
      getTranslation: (lang: string) =>
        holdsStrings(lang) ? { greeting: 'Hello' } : {},
      langChanges$: active.asObservable(),
    },
  };
}

describe('LocaleService', () => {
  function setup() {
    const { setActiveLang, useValue } = fakeTransloco();
    TestBed.configureTestingModule({
      providers: [{ provide: TranslocoService, useValue }],
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
        { provide: TranslocoService, useValue: fakeTransloco().useValue },
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
    const { setActiveLang, useValue } = fakeTransloco();
    TestBed.configureTestingModule({
      providers: [
        { provide: TranslocoService, useValue },
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
    options: {
      holdsStrings?: (lang: string) => boolean;
      served?: readonly string[];
      stored?: () => Promise<string | undefined>;
      initial?: string;
    } = {},
  ) {
    localStorage.clear();
    const transloco = fakeTransloco(load, options.holdsStrings, options.initial);
    let synced: (raw: string) => void = () => undefined;
    TestBed.configureTestingModule({
      providers: [
        { provide: TranslocoService, useValue: transloco.useValue },
        {
          provide: StateSyncService,
          useValue: {
            register: (_store: string, _key: string, apply: (raw: string) => void) => {
              synced = apply;
            },
          },
        },
        ...(options.served
          ? [{ provide: SERVED_LANGUAGES, useValue: options.served }]
          : []),
        ...(options.stored
          ? [
              {
                provide: SETTINGS_STORE,
                useValue: {
                  get: options.stored,
                  set: (key: string, value: string) => {
                    localStorage.setItem(key, value);
                    return Promise.resolve();
                  },
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
      setActiveLang: transloco.setActiveLang,
      fallBackTo: transloco.fallBackTo,
      activeInLibrary: transloco.useValue.getActiveLang,
      fromAnotherWindow: (raw: string) => synced(raw),
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

  it('does not switch when the load delivers strings, but not the chosen language’s', () => {
    const { service, setActiveLang } = loading(() => of({ greeting: 'Hello' }), {
      holdsStrings: (lang) => lang !== 'de',
    });

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

  it('names the language the library falls back to when the language in effect has no strings', () => {
    const { service, doc, fallBackTo } = loading(() => of({}), {
      served: ['de', 'fr'],
      initial: 'de',
      holdsStrings: (lang) => lang !== 'de',
    });

    fallBackTo('en');

    expect(service.lang()).toBe('en');
    expect(doc.documentElement.lang).toBe('en');
    expect(localStorage.getItem('lw.shell.lang')).toBeNull();
  });

  it('puts the library back when it falls back for a load that no longer matters', async () => {
    const { service, fallBackTo, activeInLibrary } = loading(() => of({}));

    fallBackTo('de');
    await Promise.resolve();

    expect(activeInLibrary()).toBe('en');
    expect(service.lang()).toBe('en');
  });

  it('lets a stored language apply once a choice made before it was read has failed', async () => {
    let answer: (value: string) => void = () => undefined;
    const failing = new Subject<object>();
    const { service } = loading((lang) => (lang === 'fr' ? failing : of({})), {
      served: ['en', 'de', 'fr'],
      stored: () => new Promise<string>((resolve) => (answer = resolve)),
    });

    service.setLang('fr');
    answer('de');
    await Promise.resolve();
    await Promise.resolve();
    failing.error(new Error('offline'));

    expect(service.lang()).toBe('de');
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

  it('lets a language chosen in another window cancel a choice here that is still loading', () => {
    const arrived = new Subject<object>();
    const { service, fromAnotherWindow } = loading(() => arrived);

    service.setLang('de');
    fromAnotherWindow('en');
    arrived.next({});

    expect(service.lang()).toBe('en');
  });

  it('does not let a stored value that arrives after a choice override it', async () => {
    let answer: (value: string) => void = () => undefined;
    const arrived = new Subject<object>();
    const { service } = loading(() => arrived, {
      served: ['en', 'de', 'fr'],
      stored: () => new Promise<string>((resolve) => (answer = resolve)),
    });

    service.setLang('fr');
    answer('de');
    await Promise.resolve();
    await Promise.resolve();
    arrived.next({});

    expect(service.lang()).toBe('fr');
    expect(localStorage.getItem('lw.shell.lang')).toBe('fr');
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
  async function inFrench(): Promise<{
    readonly service: LocaleService;
    readonly transloco: TranslocoService;
  }> {
    localStorage.clear();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
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
    const service = TestBed.inject(LocaleService);
    service.setLang('fr');
    await Promise.resolve();
    expect(service.lang()).toBe('fr');
    return { service, transloco };
  }

  afterEach(() => vi.restoreAllMocks());

  it('stays in the language in effect when another cannot be loaded and the fallback is loaded', async () => {
    const { service, transloco } = await inFrench();
    await firstValueFrom(transloco.load('en'));

    service.setLang('de');
    await Promise.resolve();
    await Promise.resolve();

    expect(transloco.getActiveLang()).toBe('fr');
    expect(service.lang()).toBe('fr');
    expect(localStorage.getItem('lw.shell.lang')).toBe('fr');
  });

  it('does not switch to a language that cannot be loaded when the library loads the fallback in its place', async () => {
    const { service, transloco } = await inFrench();

    service.setLang('de');
    await Promise.resolve();
    await Promise.resolve();

    expect(transloco.getActiveLang()).toBe('fr');
    expect(service.lang()).toBe('fr');
    expect(localStorage.getItem('lw.shell.lang')).toBe('fr');
  });
});

import { TestBed } from '@angular/core/testing';
import { SwUpdate } from '@angular/service-worker';
import { TranslocoService } from '@jsverse/transloco';
import { DIALOG_CLOSE_GUARD } from './dialog/dialog-close-guard';
import { provideShell } from './provide-shell';
import { SETTINGS_STORE } from './persistence/settings-store';
import { SurfaceCloseGuard } from './regions/pane/close/surface-close-guard';

describe('provideShell service worker registration', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('registers the service worker by default', () => {
    TestBed.configureTestingModule({ providers: [provideShell()] });

    expect(TestBed.inject(SwUpdate, null, { optional: true })).not.toBeNull();
  });

  it('registers nothing when the distribution opts out', () => {
    TestBed.configureTestingModule({
      providers: [provideShell({ serviceWorker: false })],
    });

    expect(TestBed.inject(SwUpdate, null, { optional: true })).toBeNull();
  });
});

describe('provideShell languages', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('serves the shipped languages when the distribution declares none', () => {
    TestBed.configureTestingModule({
      providers: [provideShell({ serviceWorker: false })],
    });

    expect(TestBed.inject(TranslocoService).config.availableLangs).toEqual([
      'en',
      'de',
    ]);
  });

  it('serves exactly the languages the distribution declares', () => {
    TestBed.configureTestingModule({
      providers: [
        provideShell({ serviceWorker: false, languages: ['fr', 'ja'] }),
      ],
    });

    expect(TestBed.inject(TranslocoService).config.availableLangs).toEqual([
      'fr',
      'ja',
    ]);
  });

  it('applies the stored language although nothing asks for the language service', async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideShell({ serviceWorker: false }),
        {
          provide: SETTINGS_STORE,
          useValue: {
            get: (key: string) =>
              Promise.resolve(key === 'lw.shell.lang' ? 'de' : undefined),
            set: () => Promise.resolve(),
            delete: () => Promise.resolve(),
          },
        },
      ],
    });
    const transloco = TestBed.inject(TranslocoService);
    await Promise.resolve();
    await Promise.resolve();

    expect(transloco.getActiveLang()).toBe('de');
  });

  it('refuses an empty declaration while composing', () => {
    expect(() => provideShell({ languages: [] })).toThrow(
      /at least one language/,
    );
  });
});

describe('provideShell dialog close guard', () => {
  afterEach(() => TestBed.resetTestingModule());

  it("guards a dialog's dismissal with the question a tab asks", () => {
    TestBed.configureTestingModule({
      providers: [provideShell({ serviceWorker: false })],
    });

    expect(TestBed.inject(DIALOG_CLOSE_GUARD)).toBe(
      TestBed.inject(SurfaceCloseGuard),
    );
  });
});

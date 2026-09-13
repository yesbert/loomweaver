import { TestBed } from '@angular/core/testing';
import { SwUpdate } from '@angular/service-worker';
import { TranslocoService } from '@jsverse/transloco';
import { provideShell } from './provide-shell';

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
      providers: [provideShell({ serviceWorker: false, languages: ['fr', 'ja'] })],
    });

    expect(TestBed.inject(TranslocoService).config.availableLangs).toEqual([
      'fr',
      'ja',
    ]);
  });

  it('refuses an empty declaration while composing', () => {
    expect(() => provideShell({ languages: [] })).toThrow(/at least one language/);
  });
});

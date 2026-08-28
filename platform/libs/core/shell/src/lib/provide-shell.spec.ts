import { TestBed } from '@angular/core/testing';
import { SwUpdate } from '@angular/service-worker';
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

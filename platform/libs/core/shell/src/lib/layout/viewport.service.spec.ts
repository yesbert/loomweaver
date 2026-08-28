import { TestBed } from '@angular/core/testing';
import { ViewportService } from './viewport.service';

type MediaChange = (event: { matches: boolean }) => void;
type WindowWithMatch = { matchMedia?: unknown };

function stubMatchMedia(matches: boolean): { fire: MediaChange } {
  let handler: MediaChange | undefined;
  (window as WindowWithMatch).matchMedia = () => ({
    matches,
    addEventListener: (_type: string, listener: MediaChange) =>
      (handler = listener),
  });
  return { fire: (event) => handler?.(event) };
}

describe('ViewportService', () => {
  const original = (window as WindowWithMatch).matchMedia;

  afterEach(() => {
    (window as WindowWithMatch).matchMedia = original;
    TestBed.resetTestingModule();
  });

  it('defaults to the roomy layout when matchMedia is unavailable (SSR / jsdom)', () => {
    (window as WindowWithMatch).matchMedia = undefined;
    expect(TestBed.inject(ViewportService).compact()).toBe(false);
  });

  it('reflects the initial breakpoint match', () => {
    stubMatchMedia(true);
    expect(TestBed.inject(ViewportService).compact()).toBe(true);
  });

  it('reacts to breakpoint changes', () => {
    const media = stubMatchMedia(true);
    const service = TestBed.inject(ViewportService);
    expect(service.compact()).toBe(true);

    media.fire({ matches: false });
    expect(service.compact()).toBe(false);
  });
});

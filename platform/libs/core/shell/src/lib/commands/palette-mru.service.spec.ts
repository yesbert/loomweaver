import { TestBed } from '@angular/core/testing';
import { PaletteMruService } from './palette-mru.service';

const KEY = 'lw.shell.command-mru';

describe('PaletteMruService', () => {
  afterEach(() => localStorage.clear());

  function service(): PaletteMruService {
    return TestBed.inject(PaletteMruService);
  }

  it('records the most recent command first and dedupes repeats', () => {
    const mru = service();
    mru.record('a');
    mru.record('b');
    mru.record('a');

    expect(mru.ids()).toEqual(['a', 'b']);
  });

  it('persists across construction and caps the list at eight', () => {
    const first = service();
    for (const id of ['1', '2', '3', '4', '5', '6', '7', '8', '9']) {
      first.record(id);
    }
    expect(first.ids()).toHaveLength(8);
    expect(first.ids()[0]).toBe('9');
    expect(first.ids()).not.toContain('1');

    TestBed.resetTestingModule();
    expect(service().ids()[0]).toBe('9');
  });

  it('parses junk in the store defensively', () => {
    localStorage.setItem(KEY, 'not json');
    expect(service().ids()).toEqual([]);

    TestBed.resetTestingModule();
    localStorage.setItem(KEY, JSON.stringify([1, 'ok', { bad: true }]));
    expect(service().ids()).toEqual(['ok']);
  });
});

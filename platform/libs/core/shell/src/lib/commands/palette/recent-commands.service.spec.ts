import { TestBed } from '@angular/core/testing';
import { RecentCommandsService } from './recent-commands.service';

const KEY = 'lw.shell.command-mru';

describe('RecentCommandsService', () => {
  afterEach(() => localStorage.clear());

  function service(): RecentCommandsService {
    return TestBed.inject(RecentCommandsService);
  }

  it('records the most recent command first and dedupes repeats', () => {
    const recent = service();
    recent.record('a');
    recent.record('b');
    recent.record('a');

    expect(recent.ids()).toEqual(['a', 'b']);
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

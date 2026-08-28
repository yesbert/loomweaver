import { TestBed } from '@angular/core/testing';
import { HiddenViewsService, parseHiddenViews } from './hidden-views.service';

const SCOPED_KEY = 'lw.shell.hidden-views:default';

describe('HiddenViewsService (the per-workspace hidden view set)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts empty and persists a hidden view under the workspace-scoped key', () => {
    const service = TestBed.inject(HiddenViewsService);
    expect(service.isHidden('outline')).toBe(false);

    service.hide('outline');

    expect(service.isHidden('outline')).toBe(true);
    expect(localStorage.getItem(SCOPED_KEY)).toBe('["outline"]');
  });

  it('show removes the id and writes the sorted remainder', () => {
    const service = TestBed.inject(HiddenViewsService);
    service.hide('outline');
    service.hide('nav');

    expect(localStorage.getItem(SCOPED_KEY)).toBe('["nav","outline"]');

    service.show('nav');
    expect(service.isHidden('nav')).toBe(false);
    expect(localStorage.getItem(SCOPED_KEY)).toBe('["outline"]');
  });

  it('restores the persisted set via peek', () => {
    localStorage.setItem(SCOPED_KEY, '["outline"]');
    const service = TestBed.inject(HiddenViewsService);
    expect(service.isHidden('outline')).toBe(true);
  });

  it('hydrate replaces the set and writes it back to the store', () => {
    const service = TestBed.inject(HiddenViewsService);
    service.hide('outline');

    service.hydrate('["nav"]');

    expect(service.isHidden('outline')).toBe(false);
    expect(service.isHidden('nav')).toBe(true);
    expect(localStorage.getItem(SCOPED_KEY)).toBe('["nav"]');
  });

  it('parseHiddenViews drops garbage instead of throwing', () => {
    expect(parseHiddenViews(undefined).size).toBe(0);
    expect(parseHiddenViews('{not json').size).toBe(0);
    expect(parseHiddenViews('{"a":1}').size).toBe(0);
    expect([...parseHiddenViews('["a",1,null,"b"]')]).toEqual(['a', 'b']);
  });
});

import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FontScaleService } from './font-scale.service';

describe('FontScaleService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.style.removeProperty('font-size');
  });

  it('defaults to md when nothing is persisted', () => {
    expect(TestBed.inject(FontScaleService).scale()).toBe('md');
  });

  it('restores a valid persisted scale', () => {
    localStorage.setItem('lw.shell.font-scale', 'lg');
    expect(TestBed.inject(FontScaleService).scale()).toBe('lg');
  });

  it('falls back to md for an invalid persisted value', () => {
    localStorage.setItem('lw.shell.font-scale', 'bogus');
    expect(TestBed.inject(FontScaleService).scale()).toBe('md');
  });

  it('setScale applies the root font-size and persists the choice', () => {
    const service = TestBed.inject(FontScaleService);
    const appRef = TestBed.inject(ApplicationRef);

    service.setScale('xl');
    appRef.tick();
    expect(document.documentElement.style.fontSize).toBe('125%');
    expect(localStorage.getItem('lw.shell.font-scale')).toBe('xl');

    service.setScale('sm');
    appRef.tick();
    expect(document.documentElement.style.fontSize).toBe('90%');
    expect(localStorage.getItem('lw.shell.font-scale')).toBe('sm');
  });

  it('sets no inline root font-size at the default, leaving the cascade to CSS', () => {
    const service = TestBed.inject(FontScaleService);
    const appRef = TestBed.inject(ApplicationRef);

    service.setScale('xl');
    appRef.tick();
    service.setScale('md');
    appRef.tick();

    expect(document.documentElement.style.fontSize).toBe('');
  });
});

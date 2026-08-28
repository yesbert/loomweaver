import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('defaults to system when nothing is persisted', () => {
    expect(TestBed.inject(ThemeService).mode()).toBe('system');
  });

  it('restores a valid persisted mode', () => {
    localStorage.setItem('lw.shell.theme', 'light');
    expect(TestBed.inject(ThemeService).mode()).toBe('light');
  });

  it('falls back to system for an invalid persisted value', () => {
    localStorage.setItem('lw.shell.theme', 'bogus');
    expect(TestBed.inject(ThemeService).mode()).toBe('system');
  });

  it('setMode updates the mode signal', () => {
    const service = TestBed.inject(ThemeService);
    service.setMode('dark');
    expect(service.mode()).toBe('dark');
  });

  it('setMode applies the dark class to <html> and persists the choice', () => {
    const service = TestBed.inject(ThemeService);
    const appRef = TestBed.inject(ApplicationRef);

    service.setMode('dark');
    appRef.tick();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('lw.shell.theme')).toBe('dark');

    service.setMode('light');
    appRef.tick();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('lw.shell.theme')).toBe('light');
  });
});

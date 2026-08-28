import { TestBed } from '@angular/core/testing';
import {
  DEFAULT_PANEL_WIDTH,
  MAX_PANEL_WIDTH,
  MIN_PANEL_WIDTH,
  PanelSizeService,
} from './panel-size.service';

const STORAGE_KEY = 'lw.shell.panel-sizes';

describe('PanelSizeService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('defaults to the fixed panel width', () => {
    expect(TestBed.inject(PanelSizeService).width('primary')).toBe(
      DEFAULT_PANEL_WIDTH,
    );
  });

  it('clamps below min and above max', () => {
    const size = TestBed.inject(PanelSizeService);

    size.setWidth('primary', 50);
    expect(size.width('primary')).toBe(MIN_PANEL_WIDTH);

    size.setWidth('primary', 9999);
    expect(size.width('primary')).toBe(MAX_PANEL_WIDTH);
  });

  it('rounds fractional widths', () => {
    const size = TestBed.inject(PanelSizeService);
    size.setWidth('primary', 300.7);
    expect(size.width('primary')).toBe(301);
  });

  it('does not persist mid-drag, but commit/endResize does', () => {
    const size = TestBed.inject(PanelSizeService);

    size.beginResize();
    size.setWidth('primary', 320);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(size.isResizing()).toBe(true);

    size.endResize();
    expect(size.isResizing()).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).toContain('320');
  });

  it('persists a discrete change via commit', () => {
    const size = TestBed.inject(PanelSizeService);
    size.setWidth('secondary', 360);
    size.commit();
    expect(localStorage.getItem(STORAGE_KEY)).toContain('360');
  });

  it('restores persisted widths across reloads', () => {
    const size = TestBed.inject(PanelSizeService);
    size.setWidth('primary', 400);
    size.commit();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});

    expect(TestBed.inject(PanelSizeService).width('primary')).toBe(400);
  });

  it('ignores a corrupted payload and re-clamps out-of-range stored values', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ primary: 'wide', secondary: 9999, tertiary: 260 }),
    );

    const size = TestBed.inject(PanelSizeService);
    expect(size.width('primary')).toBe(DEFAULT_PANEL_WIDTH);
    expect(size.width('secondary')).toBe(MAX_PANEL_WIDTH);
    expect(size.width('tertiary')).toBe(260);
  });

  it('survives an unparseable payload', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');
    expect(TestBed.inject(PanelSizeService).width('primary')).toBe(
      DEFAULT_PANEL_WIDTH,
    );
  });
});

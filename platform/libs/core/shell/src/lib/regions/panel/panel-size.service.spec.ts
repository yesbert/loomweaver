import { TestBed } from '@angular/core/testing';
import { PanelSizeService } from './panel-size.service';
import { KeyValueStore } from '../../persistence/key-value-store';
import { provideWorkingStateStore } from '../../persistence/working-state-store';
import {
  DEFAULT_PANEL_WIDTH,
  MAX_PANEL_WIDTH,
  MIN_PANEL_WIDTH,
} from '../../layout/panel-widths';

const STORAGE_KEY = 'lw.shell.panel-sizes';

class HandAnsweredStore implements KeyValueStore {
  readonly written = new Map<string, string>();
  private readonly waiting: ((raw: string | undefined) => void)[] = [];

  get(): Promise<string | undefined> {
    return new Promise((resolve) => {
      this.waiting.push(resolve);
    });
  }

  set(key: string, value: string): Promise<void> {
    this.written.set(key, value);
    return Promise.resolve();
  }

  delete(key: string): Promise<void> {
    this.written.delete(key);
    return Promise.resolve();
  }

  async answer(raw: string | undefined): Promise<void> {
    for (const resolve of this.waiting.splice(0)) {
      resolve(raw);
    }
    await Promise.resolve();
    await Promise.resolve();
  }
}

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

  it('ignores a width that is not a number and keeps the one it had', () => {
    const size = TestBed.inject(PanelSizeService);
    size.setWidth('primary', 320);

    size.setWidth('primary', NaN);
    size.commit();

    expect(size.width('primary')).toBe(320);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('{"primary":320}');
  });

  it('brings a width of plus or minus infinity into the usable range', () => {
    const size = TestBed.inject(PanelSizeService);

    size.setWidth('primary', Infinity);
    expect(size.width('primary')).toBe(MAX_PANEL_WIDTH);

    size.setWidth('primary', -Infinity);
    expect(size.width('primary')).toBe(MIN_PANEL_WIDTH);
  });

  it('writes nothing when a commit changes no width', () => {
    const size = TestBed.inject(PanelSizeService);
    size.setWidth('primary', 320);
    size.commit();
    localStorage.removeItem(STORAGE_KEY);

    size.commit();
    size.setWidth('primary', 320);
    size.commit();
    size.setWidth('primary', NaN);
    size.commit();
    size.beginResize();
    size.endResize();

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
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

describe('PanelSizeService on a store that answers later', () => {
  it('keeps a width set before the store answered, beside the widths the store held', async () => {
    const store = new HandAnsweredStore();
    TestBed.configureTestingModule({
      providers: [provideWorkingStateStore(store)],
    });
    const size = TestBed.inject(PanelSizeService);

    size.setWidth('primary', 320);
    size.commit();
    await store.answer(JSON.stringify({ secondary: 400 }));

    expect(size.width('primary')).toBe(320);
    expect(size.width('secondary')).toBe(400);
    expect(JSON.parse(store.written.get(STORAGE_KEY) ?? '{}')).toEqual({
      primary: 320,
      secondary: 400,
    });
  });

  it('shows a width while it is dragged and takes the stored one for a panel nobody touched', async () => {
    const store = new HandAnsweredStore();
    TestBed.configureTestingModule({
      providers: [provideWorkingStateStore(store)],
    });
    const size = TestBed.inject(PanelSizeService);

    size.beginResize();
    size.setWidth('primary', 320);
    await store.answer(JSON.stringify({ primary: 280, secondary: 400 }));

    expect(size.width('primary')).toBe(320);
    expect(size.width('secondary')).toBe(400);
    expect(store.written.has(STORAGE_KEY)).toBe(false);

    size.endResize();

    expect(JSON.parse(store.written.get(STORAGE_KEY) ?? '{}')).toEqual({
      primary: 320,
      secondary: 400,
    });
  });
});

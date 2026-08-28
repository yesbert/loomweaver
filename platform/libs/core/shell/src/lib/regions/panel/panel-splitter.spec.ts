import { ComponentRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { PanelSplitter } from './panel-splitter';
import {
  DEFAULT_PANEL_WIDTH,
  MAX_PANEL_WIDTH,
  MIN_PANEL_WIDTH,
  PanelSizeService,
} from './panel-size.service';

function transloco() {
  return TranslocoTestingModule.forRoot({
    langs: { en: { panel: { resize: 'Resize panel' } } },
    translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
    preloadLangs: true,
  });
}

describe('PanelSplitter', () => {
  let fixture: ComponentFixture<PanelSplitter>;
  let ref: ComponentRef<PanelSplitter>;
  let size: PanelSizeService;

  function render(dock: 'left' | 'right') {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [PanelSplitter, transloco()] });
    fixture = TestBed.createComponent(PanelSplitter);
    ref = fixture.componentRef;
    ref.setInput('regionId', 'primary');
    ref.setInput('dock', dock);
    size = TestBed.inject(PanelSizeService);
    fixture.detectChanges();
  }

  function press(key: string, shiftKey = false): void {
    const handle = fixture.nativeElement.querySelector(
      '[role="separator"]',
    ) as HTMLElement;
    handle.dispatchEvent(
      new KeyboardEvent('keydown', { key, shiftKey, bubbles: true }),
    );
  }

  function pointer(
    type: string,
    props: { clientX?: number; pointerId?: number },
  ): Event {
    const handle = fixture.nativeElement.querySelector(
      '[role="separator"]',
    ) as HTMLElement;
    handle.setPointerCapture = () => undefined;
    handle.releasePointerCapture = () => undefined;
    const event = Object.assign(new Event(type, { bubbles: true }), props);
    handle.dispatchEvent(event);
    return event;
  }

  it('ignores an unrelated key', () => {
    render('left');
    press('Enter');
    expect(size.width('primary')).toBe(DEFAULT_PANEL_WIDTH);
  });

  it('exposes the separator role with the width bounds', () => {
    render('left');
    const handle = fixture.nativeElement.querySelector(
      '[role="separator"]',
    ) as HTMLElement;
    expect(handle.getAttribute('aria-orientation')).toBe('vertical');
    expect(handle.getAttribute('aria-valuemin')).toBe(String(MIN_PANEL_WIDTH));
    expect(handle.getAttribute('aria-valuemax')).toBe(String(MAX_PANEL_WIDTH));
    expect(handle.getAttribute('aria-valuenow')).toBe(
      String(DEFAULT_PANEL_WIDTH),
    );
  });

  it('ArrowRight grows a left-docked panel, ArrowLeft shrinks it', () => {
    render('left');
    press('ArrowRight');
    expect(size.width('primary')).toBe(DEFAULT_PANEL_WIDTH + 16);
    press('ArrowLeft');
    expect(size.width('primary')).toBe(DEFAULT_PANEL_WIDTH);
  });

  it('mirrors the direction for a right-docked panel', () => {
    render('right');
    press('ArrowRight');
    expect(size.width('primary')).toBe(DEFAULT_PANEL_WIDTH - 16);
  });

  it('uses a coarse step with Shift', () => {
    render('left');
    press('ArrowRight', true);
    expect(size.width('primary')).toBe(DEFAULT_PANEL_WIDTH + 48);
  });

  it('Home/End jump to the min/max width and persist', () => {
    render('left');
    press('End');
    expect(size.width('primary')).toBe(MAX_PANEL_WIDTH);
    press('Home');
    expect(size.width('primary')).toBe(MIN_PANEL_WIDTH);
    expect(localStorage.getItem('lw.shell.panel-sizes')).toContain(
      String(MIN_PANEL_WIDTH),
    );
  });

  it('pointer drag resizes a left panel and commits on release', () => {
    render('left');
    pointer('pointerdown', { pointerId: 1, clientX: 100 });
    pointer('pointermove', { clientX: 140 });
    expect(size.width('primary')).toBe(DEFAULT_PANEL_WIDTH + 40);
    pointer('pointerup', { pointerId: 1 });
    pointer('pointermove', { clientX: 300 });
    expect(size.width('primary')).toBe(DEFAULT_PANEL_WIDTH + 40);
  });

  it('mirrors pointer direction for a right panel', () => {
    render('right');
    pointer('pointerdown', { pointerId: 1, clientX: 100 });
    pointer('pointermove', { clientX: 140 });
    expect(size.width('primary')).toBe(DEFAULT_PANEL_WIDTH - 40);
  });

  it('ignores pointer move/up before a drag starts', () => {
    render('left');
    pointer('pointermove', { clientX: 140 });
    pointer('pointerup', { pointerId: 1 });
    expect(size.width('primary')).toBe(DEFAULT_PANEL_WIDTH);
  });

  it('reflects the live width in aria-valuenow', () => {
    render('left');
    press('End');
    fixture.detectChanges();
    const handle = fixture.nativeElement.querySelector(
      '[role="separator"]',
    ) as HTMLElement;
    expect(handle.getAttribute('aria-valuenow')).toBe(String(MAX_PANEL_WIDTH));
  });
});

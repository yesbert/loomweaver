import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoService, TranslocoTestingModule } from '@jsverse/transloco';
import { provideLayout } from '../../layout/layout';
import { SurfaceCloseGuard } from '../pane/close/surface-close-guard';
import { PanelSplitter } from './panel-splitter';
import {
  DEFAULT_PANEL_WIDTH,
  MAX_PANEL_WIDTH,
  MIN_PANEL_WIDTH,
  PanelSizeService,
} from './panel-size.service';
import { SidebarService } from './sidebar.service';

const STORAGE_KEY = 'lw.shell.panel-sizes';

const layout = provideLayout({
  regions: [
    { id: 'tree', type: 'panel', dock: 'left' },
    { id: 'main', type: 'content', dock: 'center' },
    {
      id: 'chat',
      type: 'panel',
      dock: 'right',
      width: 360,
      minWidth: 280,
      maxWidth: 640,
    },
  ],
});

function sizes(): PanelSizeService {
  TestBed.configureTestingModule({ providers: [layout] });
  return TestBed.inject(PanelSizeService);
}

describe('panel widths declared by the layout', () => {
  beforeEach(() => localStorage.clear());

  it('starts a panel at its declared width until it is resized', () => {
    expect(sizes().width('chat')).toBe(360);
  });

  it('falls back to the workbench values for a panel declaring none', () => {
    const size = sizes();

    expect(size.width('tree')).toBe(DEFAULT_PANEL_WIDTH);
    expect(size.minWidth('tree')).toBe(MIN_PANEL_WIDTH);
    expect(size.maxWidth('tree')).toBe(MAX_PANEL_WIDTH);
  });

  it("clamps to the panel's own bounds and leaves another panel's alone", () => {
    const size = sizes();

    size.setWidth('chat', 9999);
    size.setWidth('tree', 9999);

    expect(size.width('chat')).toBe(640);
    expect(size.width('tree')).toBe(MAX_PANEL_WIDTH);

    size.setWidth('chat', 1);
    expect(size.width('chat')).toBe(280);
  });

  it('remembers a released width even when it equals the start width', () => {
    const size = sizes();

    size.setWidth('chat', 360);
    size.commit();

    expect(localStorage.getItem(STORAGE_KEY)).toContain('"chat":360');
  });

  it('shows a width stored under wider bounds at the current widest, keeping what was stored', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ chat: 700 }));

    expect(sizes().width('chat')).toBe(640);
    expect(localStorage.getItem(STORAGE_KEY)).toContain('"chat":700');
  });

  it('returns every panel to its declared start width on reset, at once', () => {
    const size = sizes();
    size.setWidth('chat', 500);
    size.commit();

    size.reset();

    expect(size.width('chat')).toBe(360);
  });
});

describe('a width set from the distribution for a panel with declared bounds', () => {
  beforeEach(() => localStorage.clear());

  it("is clamped to that panel's bounds and remembered", () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        layout,
        {
          provide: SurfaceCloseGuard,
          useValue: { guarded: (_: unknown, run: () => void) => run() },
        },
        { provide: TranslocoService, useValue: { translate: (key: string) => key } },
      ],
    });
    const sidebars = TestBed.inject(SidebarService);

    sidebars.setWidth('chat', 9999);

    expect(sidebars.width('chat')).toBe(640);
    expect(localStorage.getItem(STORAGE_KEY)).toContain('"chat":640');
  });
});

describe('the splitter of a panel with declared bounds', () => {
  beforeEach(() => localStorage.clear());

  function render() {
    TestBed.configureTestingModule({
      imports: [
        PanelSplitter,
        TranslocoTestingModule.forRoot({
          langs: { en: { panel: { resize: 'Resize panel' } } },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
          preloadLangs: true,
        }),
      ],
      providers: [layout],
    });
    const fixture = TestBed.createComponent(PanelSplitter);
    fixture.componentRef.setInput('regionId', 'chat');
    fixture.componentRef.setInput('dock', 'right');
    fixture.detectChanges();
    const handle = fixture.nativeElement.querySelector(
      '[role="separator"]',
    ) as HTMLElement;
    const press = (key: string) =>
      handle.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    return { fixture, handle, press, size: TestBed.inject(PanelSizeService) };
  }

  it('announces its own panel bounds', () => {
    const { handle } = render();

    expect(handle.getAttribute('aria-valuemin')).toBe('280');
    expect(handle.getAttribute('aria-valuemax')).toBe('640');
    expect(handle.getAttribute('aria-valuenow')).toBe('360');
  });

  it('jumps to its own panel extremes from the keyboard', () => {
    const { press, size } = render();

    press('End');
    expect(size.width('chat')).toBe(640);
    press('Home');
    expect(size.width('chat')).toBe(280);
  });
});

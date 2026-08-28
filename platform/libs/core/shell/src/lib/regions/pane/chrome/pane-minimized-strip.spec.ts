import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService, TranslocoTestingModule } from '@jsverse/transloco';
import { PaneChromeService } from './pane-chrome.service';
import { PaneLeaf } from '../tree/pane-node';
import { PaneMinimizedStrip } from './pane-minimized-strip';

function leaf(tabs: PaneLeaf['tabs'], active?: string): PaneLeaf {
  return { kind: 'leaf', id: 'p1', tabs, active };
}

describe('PaneMinimizedStrip', () => {
  let fixture: ComponentFixture<PaneMinimizedStrip>;
  let chrome: PaneChromeService;

  function create(
    paneLeaf: PaneLeaf,
    orientation: 'row' | 'column' = 'column',
  ): void {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestingModule.forRoot({
          langs: { en: {} },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
          preloadLangs: true,
        }),
      ],
    });
    chrome = TestBed.inject(PaneChromeService);
    fixture = TestBed.createComponent(PaneMinimizedStrip);
    fixture.componentRef.setInput('dock', 'content');
    fixture.componentRef.setInput('leaf', paneLeaf);
    fixture.componentRef.setInput('orientation', orientation);
    fixture.detectChanges();
  }

  function button(): HTMLElement {
    return fixture.nativeElement.querySelector(
      '[data-testid="pane-minimized-strip"]',
    );
  }

  it('shows the literal title of the active tab and no badge for a single tab', () => {
    create(leaf([{ path: 'doc/1', title: 'Report', literalTitle: true }]));
    expect(button().textContent).toContain('Report');
    expect(button().getAttribute('aria-label')).toBe(
      'content.split.restoreMinimized',
    );
    expect(fixture.nativeElement.querySelector('.lw-badge')).toBeNull();
  });

  it('shows a +N badge and count restore label for several tabs', () => {
    create(
      leaf(
        [
          { path: 'a', title: 'A', literalTitle: true },
          { path: 'b', title: 'B', literalTitle: true },
          { path: 'c', title: 'C', literalTitle: true },
        ],
        'a',
      ),
    );
    expect(fixture.nativeElement.querySelector('.lw-badge').textContent).toBe(
      '+2',
    );
    expect(button().getAttribute('aria-label')).toBe(
      'content.split.restoreMinimizedCount',
    );
  });

  it('falls back to the route/home label when the tab has no title', () => {
    create(leaf([{ path: '' }]));
    expect(button().textContent).toContain('content.split.home');
  });

  it('re-translates label and restore hint after a live language switch', () => {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestingModule.forRoot({
          langs: {
            en: {
              content: {
                split: { home: 'Home', restoreMinimized: 'Restore pane' },
              },
            },
            de: {
              content: {
                split: { home: 'Start', restoreMinimized: 'Bereich zeigen' },
              },
            },
          },
          translocoConfig: {
            availableLangs: ['en', 'de'],
            defaultLang: 'en',
            reRenderOnLangChange: true,
          },
          preloadLangs: true,
        }),
      ],
    });
    fixture = TestBed.createComponent(PaneMinimizedStrip);
    fixture.componentRef.setInput('dock', 'content');
    fixture.componentRef.setInput('leaf', leaf([{ path: '' }]));
    fixture.componentRef.setInput('orientation', 'column');
    fixture.detectChanges();
    expect(button().textContent).toContain('Home');
    expect(button().getAttribute('aria-label')).toBe('Restore pane');

    TestBed.inject(TranslocoService).setActiveLang('de');
    fixture.detectChanges();

    expect(button().textContent).toContain('Start');
    expect(button().getAttribute('aria-label')).toBe('Bereich zeigen');
  });

  it('restores the pane on click via PaneChromeService', () => {
    create(leaf([{ path: 'a', title: 'A', literalTitle: true }]));
    chrome.toggleMinimize('content', 'p1');
    expect(chrome.isMinimized('content', 'p1')).toBe(true);

    button().click();
    expect(chrome.isMinimized('content', 'p1')).toBe(false);
  });
});

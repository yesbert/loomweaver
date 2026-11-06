import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { PaneToolbar } from './pane-toolbar';

describe('PaneToolbar', () => {
  it('announces that its new-tab control opens a menu, collapsed until it opens', () => {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestingModule.forRoot({
          langs: { en: {} },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
          preloadLangs: true,
        }),
      ],
    });
    const fixture = TestBed.createComponent(PaneToolbar);
    fixture.componentRef.setInput('canNewTab', true);
    fixture.componentRef.setInput('newTabTestId', 'content-new-tab');
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="content-new-tab"]',
    );
    expect(button?.getAttribute('aria-haspopup')).toBe('menu');
    expect(button?.getAttribute('aria-expanded')).toBe('false');
  });
});

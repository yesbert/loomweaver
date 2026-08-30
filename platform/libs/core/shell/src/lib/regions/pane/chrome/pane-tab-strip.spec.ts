import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  Translation,
  TranslocoLoader,
  provideTransloco,
} from '@jsverse/transloco';
import { Observable, Subject } from 'rxjs';
import { PaneTabStrip } from './pane-tab-strip';
import { StripTab } from './strip-tab';

const bundle = new Subject<Translation>();

class PendingLoader implements TranslocoLoader {
  getTranslation(): Observable<Translation> {
    return bundle.asObservable();
  }
}

function tab(overrides: Partial<StripTab> = {}): StripTab {
  return {
    path: 'quotes/q-1',
    title: 'quotes.document.title',
    literalTitle: false,
    closable: true,
    preview: false,
    pinned: false,
    ...overrides,
  };
}

describe('PaneTabStrip', () => {
  let fixture: ComponentFixture<PaneTabStrip>;

  function create(tabs: StripTab[]): void {
    TestBed.configureTestingModule({
      providers: [
        provideTransloco({
          config: { availableLangs: ['en'], defaultLang: 'en' },
          loader: PendingLoader,
        }),
      ],
    });
    fixture = TestBed.createComponent(PaneTabStrip);
    fixture.componentRef.setInput('tabs', tabs);
    fixture.componentRef.setInput('activeId', tabs[0]?.path ?? '');
    fixture.componentRef.setInput('source', { dock: 'content', paneId: 'main' });
    fixture.detectChanges();
  }

  function deliverBundle(): void {
    bundle.next({ quotes: { document: { title: 'Quote' } } });
    fixture.detectChanges();
  }

  function labels(): string[] {
    const host = fixture.nativeElement as HTMLElement;
    return [...host.querySelectorAll<HTMLElement>('[role="tab"]')].map(
      (element) => element.textContent?.trim() ?? '',
    );
  }

  it('announces the control that opens the new-tab menu, collapsed until it opens', () => {
    create([tab()]);
    fixture.componentRef.setInput('canAddTab', true);
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="pane-add-tab"]',
    );
    expect(button?.getAttribute('aria-haspopup')).toBe('menu');
    expect(button?.getAttribute('aria-expanded')).toBe('false');
  });

  it('never paints a raw translation key while the bundle is still in flight', () => {
    create([tab()]);
    expect(labels()[0]).not.toContain('quotes.document.title');
  });

  it('paints the translated title once the bundle arrives', () => {
    create([tab()]);
    deliverBundle();
    expect(labels()[0]).toContain('Quote');
  });

  it('paints a literal title verbatim, without waiting for a bundle', () => {
    create([tab({ title: 'Q-2026-0001', literalTitle: true })]);
    expect(labels()[0]).toContain('Q-2026-0001');
  });
});

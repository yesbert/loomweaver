import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  Translation,
  TranslocoLoader,
  provideTransloco,
} from '@jsverse/transloco';
import { Observable, Subject } from 'rxjs';
import { RetainedViewStash } from '../retention/retained-view-stash';
import { PaneTabStrip } from './pane-tab-strip';
import { StripTab } from './strip-tab';

interface StashEntry {
  readonly key: string;
  readonly instance: unknown;
}

function saved(): unknown {
  return { surfaceDirty: () => false };
}

function unsaved(): unknown {
  return { surfaceDirty: () => true };
}

function stashOf(entries: readonly StashEntry[]): unknown {
  return {
    version: signal(0),
    keyedInstances: () => [...entries],
    instancesFor: (scope: string, path: string) =>
      entries
        .filter(
          (entry) =>
            entry.key === `${scope}|${path}` ||
            entry.key.startsWith(`${scope}|${path}|`),
        )
        .map((entry) => entry.instance),
  };
}

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

  function create(tabs: StripTab[], entries: readonly StashEntry[] = []): void {
    TestBed.configureTestingModule({
      providers: [
        provideTransloco({
          config: { availableLangs: ['en'], defaultLang: 'en' },
          loader: PendingLoader,
        }),
        { provide: RetainedViewStash, useValue: stashOf(entries) },
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
  function marks(): number {
    const host = fixture.nativeElement as HTMLElement;
    return host.querySelectorAll('[data-testid="tab-unsaved"]').length;
  }

  function tabLabel(): string {
    const host = fixture.nativeElement as HTMLElement;
    return (
      host
        .querySelector('[role="tab"]')
        ?.getAttribute('aria-label') ?? ''
    );
  }

  it('marks a tab whose surface holds unsaved work', () => {
    create([tab()], [{ key: 'content:main|quotes/q-1', instance: unsaved() }]);

    expect(marks()).toBe(1);
  });

  it('leaves a tab unmarked once its surface reports saved', () => {
    create([tab()], [{ key: 'content:main|quotes/q-1', instance: saved() }]);

    expect(marks()).toBe(0);
  });

  it('marks an arrangement whose unsaved child is not the one on top', () => {
    create(
      [tab()],
      [
        { key: 'content:main|quotes/q-1', instance: saved() },
        {
          key: 'container@quotes/q-1:main|quotes/q-1/positions',
          instance: saved(),
        },
        {
          key: 'container@quotes/q-1:main|quotes/q-1/customer',
          instance: unsaved(),
        },
      ],
    );

    expect(marks()).toBe(1);
  });

  it('keeps the mark and the close control in one slot, apart from the tab itself', () => {
    create([tab()], [{ key: 'content:main|quotes/q-1', instance: unsaved() }]);
    const host = fixture.nativeElement as HTMLElement;

    const mark = host.querySelector('[data-testid="tab-unsaved"]');
    const close = host.querySelector('[data-testid="tab-close"]');

    expect(mark?.parentElement).toBe(close?.parentElement);
    expect(close?.parentElement?.contains(host.querySelector('[role="tab"]'))).toBe(
      false,
    );
  });

  it('leaves the tab its own tone, so only the mark carries the state', () => {
    create([tab()], [{ key: 'content:main|quotes/q-1', instance: unsaved() }]);
    const host = fixture.nativeElement as HTMLElement;

    const button = host.querySelector('[role="tab"]');

    expect(button?.classList.contains('text-content')).toBe(true);
    expect(button?.classList.contains('text-unsaved')).toBe(false);
  });

  it('draws the tone from the token, not from whatever the tab inherits', () => {
    create([tab()], [{ key: 'content:main|quotes/q-1', instance: unsaved() }]);
    const host = fixture.nativeElement as HTMLElement;

    const mark = host.querySelector('[data-testid="tab-unsaved"]');

    expect(mark?.classList.contains('bg-unsaved')).toBe(true);
  });

  it('marks a sidebar tab, which carries an icon and no title, the same way', () => {
    create(
      [tab({ path: 'view:quotes.customer', icon: 'customer' })],
      [{ key: 'content:main|view:quotes.customer', instance: unsaved() }],
    );
    fixture.componentRef.setInput('variant', 'icons');
    fixture.detectChanges();

    expect(marks()).toBe(1);
  });

  it('says in the tab name that the work is unsaved', () => {
    create(
      [tab({ title: 'Q-2026-0001', literalTitle: true })],
      [{ key: 'content:main|quotes/q-1', instance: unsaved() }],
    );
    bundle.next({ content: { unsavedTab: '{{title}}, unsaved changes' } });
    fixture.detectChanges();

    expect(tabLabel()).toBe('Q-2026-0001, unsaved changes');
  });

  it('says nothing beyond the title once the work is saved', () => {
    create(
      [tab({ title: 'Q-2026-0001', literalTitle: true })],
      [{ key: 'content:main|quotes/q-1', instance: saved() }],
    );
    bundle.next({ content: { unsavedTab: '{{title}}, unsaved changes' } });
    fixture.detectChanges();

    expect(tabLabel()).toBe('Q-2026-0001');
  });
});

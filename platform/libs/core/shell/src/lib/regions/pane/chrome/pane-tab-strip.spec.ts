import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import {
  Translation,
  TranslocoLoader,
  provideTransloco,
} from '@jsverse/transloco';
import { Observable, Subject } from 'rxjs';
import { RetainedViewStash } from '../retention/retained-view-stash';
import { MenuTriggerDirective } from '../../../menu/menu-trigger.directive';
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
    movable: true,
    preview: false,
    pinned: false,
    ...overrides,
  };
}

describe('PaneTabStrip', () => {
  let fixture: ComponentFixture<PaneTabStrip>;

  function create(
    tabs: StripTab[],
    entries: readonly StashEntry[] = [],
    gestures: { reorderable?: boolean; draggable?: boolean } = {},
  ): void {
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
    fixture.componentRef.setInput('source', {
      dock: 'content',
      paneId: 'main',
    });
    fixture.componentRef.setInput('reorderable', gestures.reorderable ?? false);
    fixture.componentRef.setInput('draggable', gestures.draggable ?? false);
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

  function tabByPath(path: string): HTMLElement | null {
    const host = fixture.nativeElement as HTMLElement;
    return host.querySelector<HTMLElement>(
      `[data-tab-path="${CSS.escape(path)}"]`,
    );
  }

  function dragHost(path: string): HTMLElement | null {
    return tabByPath(path)?.closest<HTMLElement>('.cdk-drag') ?? null;
  }

  const movable = [
    tab({ path: 'fixed', closable: false }),
    tab({ path: 'loose' }),
    tab({ path: 'anchored', pinned: true }),
  ];

  it('lets a tab that cannot be closed be reordered and dragged', () => {
    create(movable, [], { reorderable: true, draggable: true });

    expect(tabByPath('fixed')?.dataset['reorderId']).toBe('fixed');
    expect(dragHost('fixed')?.classList).not.toContain('cdk-drag-disabled');
  });

  it('puts a fixed tab in the band an ordinary one is in, so it can move among them', () => {
    create(movable, [], { reorderable: true, draggable: true });

    expect(tabByPath('fixed')?.dataset['reorderBand']).toBe('dynamic');
    expect(tabByPath('loose')?.dataset['reorderBand']).toBe('dynamic');
    expect(tabByPath('anchored')?.dataset['reorderBand']).toBe('pinned');
  });

  it('lets the pointer seat a fixed tab among the tabs it stands with, but not among the pinned', () => {
    create(movable, [], { reorderable: true, draggable: true });
    const strip = fixture.componentInstance as unknown as {
      sortPredicate(index: number, drag: unknown): boolean;
    };
    const dragged = { data: 'fixed' };

    expect(strip.sortPredicate(1, dragged)).toBe(true);
    expect(strip.sortPredicate(2, dragged)).toBe(false);
  });

  it('carries the fixed tab in the order a reorder reports', () => {
    create(movable, [], { reorderable: true, draggable: true });
    const orders: string[][] = [];
    fixture.componentInstance.reorderTabs.subscribe((order) => {
      orders.push(order);
    });

    const strip = fixture.componentInstance as unknown as {
      onDrop(event: unknown): void;
    };
    const container = { id: 'content:main' };
    strip.onDrop({
      previousContainer: container,
      container,
      previousIndex: 0,
      currentIndex: 1,
      item: { data: 'fixed' },
    });

    expect(orders).toEqual([['loose', 'fixed', 'anchored']]);
  });

  it('offers neither gesture on a tab the pane does not hold', () => {
    create(
      [tab({ path: 'facet', closable: false, movable: false }), tab()],
      [],
      { reorderable: true, draggable: true },
    );

    expect(tabByPath('facet')?.dataset['reorderId']).toBeUndefined();
    expect(dragHost('facet')?.classList).toContain('cdk-drag-disabled');
    expect(tabByPath('quotes/q-1')?.dataset['reorderId']).toBe('quotes/q-1');
  });

  it('offers neither gesture where the distribution switched them off', () => {
    create(movable);

    expect(tabByPath('fixed')?.dataset['reorderId']).toBeUndefined();
    expect(tabByPath('loose')?.dataset['reorderId']).toBeUndefined();
    expect(dragHost('loose')?.classList).toContain('cdk-drag-disabled');
  });

  it('still refuses to close a fixed or a pinned tab from the keyboard', () => {
    create(movable, [], { reorderable: true, draggable: true });
    const closed: string[] = [];
    fixture.componentInstance.closeTab.subscribe((closing) => {
      closed.push(closing.path);
    });

    for (const path of ['fixed', 'anchored', 'loose']) {
      tabByPath(path)?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }),
      );
    }

    expect(closed).toEqual(['loose']);
    expect(tabByPath('fixed')?.getAttribute('aria-keyshortcuts')).toBeNull();
  });

  it('is one stop in the focus order, and the arrow keys walk its tabs', () => {
    create(movable);
    const focusable = () =>
      [
        ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
          '[role="tab"]',
        ),
      ]
        .filter((element) => element.tabIndex === 0)
        .map((element) => element.dataset['tabPath']);

    expect(focusable()).toEqual(['fixed']);

    tabByPath('fixed')?.focus();
    tabByPath('fixed')?.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
        cancelable: true,
      }),
    );

    expect(document.activeElement).toBe(tabByPath('loose'));
    expect(focusable()).toEqual(['loose']);
    expect(tabByPath('fixed')?.getAttribute('aria-selected')).toBe('true');
  });

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

  it("announces a toggling action's state, and a plain action as a plain button", () => {
    create([
      tab({
        actions: [
          { id: 'on', icon: 'pin', title: 'on', pressed: true },
          { id: 'off', icon: 'pin', title: 'off', pressed: false },
          { id: 'plain', icon: 'add', title: 'plain' },
        ],
      }),
    ]);

    const host = fixture.nativeElement as HTMLElement;
    const pressed = [...host.querySelectorAll('button[aria-pressed]')].map(
      (button) => button.getAttribute('aria-pressed'),
    );
    expect(pressed).toEqual(['true', 'false']);
    expect(
      host.querySelectorAll('button lw-icon').length,
    ).toBeGreaterThanOrEqual(3);
  });
  function marks(): number {
    const host = fixture.nativeElement as HTMLElement;
    return host.querySelectorAll('[data-testid="tab-unsaved"]').length;
  }

  function tabLabel(): string {
    const host = fixture.nativeElement as HTMLElement;
    return host.querySelector('[role="tab"]')?.getAttribute('aria-label') ?? '';
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
    expect(
      close?.parentElement?.contains(host.querySelector('[role="tab"]')),
    ).toBe(false);
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

describe('PaneTabStrip — what a tab tells its menu about where it stands', () => {
  let fixture: ComponentFixture<PaneTabStrip>;

  function create(tabs: StripTab[], contextGroup: string): void {
    TestBed.configureTestingModule({
      providers: [
        provideTransloco({
          config: { availableLangs: ['en'], defaultLang: 'en' },
          loader: PendingLoader,
        }),
        { provide: RetainedViewStash, useValue: stashOf([]) },
      ],
    });
    fixture = TestBed.createComponent(PaneTabStrip);
    fixture.componentRef.setInput('tabs', tabs);
    fixture.componentRef.setInput('activeId', tabs[0]?.path ?? '');
    fixture.componentRef.setInput('source', {
      dock: 'content',
      paneId: 'main',
    });
    fixture.componentRef.setInput('contextGroup', contextGroup);
    fixture.componentRef.setInput('contextMenuSlot', 'content/tab/context');
    fixture.componentRef.setInput('viewContextMenuSlot', 'panel/view/context');
    fixture.detectChanges();
  }

  function contexts(): Record<string, unknown>[] {
    return fixture.debugElement
      .queryAll(By.directive(MenuTriggerDirective))
      .map((element) => element.injector.get(MenuTriggerDirective).context())
      .filter((context) => 'targetKind' in context);
  }

  it('says a lone content tab is alone in its pane', () => {
    create([tab()], 'content');
    expect(contexts()).toEqual([
      expect.objectContaining({ targetKind: 'content-tab', sole: true }),
    ]);
  });

  it('says a content tab with company is not alone', () => {
    create([tab(), tab({ path: 'quotes/q-2' })], 'content');
    expect(contexts()).toEqual([
      expect.objectContaining({ sole: false }),
      expect.objectContaining({ sole: false }),
    ]);
  });

  it('names the pane a content tab stands in and whether it carries the address', () => {
    create([tab()], 'content');
    fixture.componentRef.setInput('urlDriven', true);
    fixture.detectChanges();
    expect(contexts()).toEqual([
      expect.objectContaining({ paneId: 'main', primary: true }),
    ]);
  });

  it('says a content tab in another pane is not in the address-carrying one', () => {
    create([tab()], 'content');
    fixture.componentRef.setInput('source', { dock: 'content', paneId: 'p2' });
    fixture.detectChanges();
    expect(contexts()).toEqual([
      expect.objectContaining({ paneId: 'p2', primary: false }),
    ]);
  });

  it('says a view tab in the main area stands in it', () => {
    create([tab({ path: 'view:outline' })], 'content');
    expect(contexts()).toEqual([
      expect.objectContaining({
        targetKind: 'view-tab',
        viewId: 'outline',
        inContent: true,
        sole: true,
      }),
    ]);
  });

  it('says a view tab in a sidebar does not stand in the main area', () => {
    create(
      [tab({ path: 'view:outline' }), tab({ path: 'view:list' })],
      'left-panel',
    );
    expect(contexts()).toEqual([
      expect.objectContaining({ inContent: false, sole: false }),
      expect.objectContaining({ inContent: false, sole: false }),
    ]);
  });
});

import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  Translation,
  TranslocoLoader,
  TranslocoService,
  provideTransloco,
} from '@jsverse/transloco';
import { Observable, Subject } from 'rxjs';
import { TabBadge } from '@loomweaver/plugin-sdk';
import { RetainedViewStash } from '../retention/retained-view-stash';
import { PaneTabStrip } from './pane-tab-strip';
import { StripTab } from './strip-tab';

const BUNDLES: Record<string, Translation> = {
  en: {
    parts: { advanced: 'Advanced' },
    badges: { developer: 'Developer' },
    content: {
      unsavedTab: '{{title}}, unsaved changes',
      badgedTab: '{{title}}, {{badge}}',
      previewHint: 'double-click to keep',
    },
  },
  de: {
    parts: { advanced: 'Erweitert' },
    badges: { developer: 'Entwicklung' },
    content: { badgedTab: '{{title}}, {{badge}}' },
  },
};

class Bundles implements TranslocoLoader {
  getTranslation(lang: string): Observable<Translation> {
    const loaded = new Subject<Translation>();
    queueMicrotask(() => {
      loaded.next(BUNDLES[lang]);
      loaded.complete();
    });
    return loaded;
  }
}

function tab(overrides: Partial<StripTab> = {}): StripTab {
  return {
    path: 'assistants/5/advanced',
    title: 'parts.advanced',
    literalTitle: false,
    closable: true,
    movable: true,
    preview: false,
    pinned: false,
    ...overrides,
  };
}

const DEVELOPER: TabBadge = { text: 'badges.developer', tone: 'brand' };

describe('a badge on a tab', () => {
  let fixture: ComponentFixture<PaneTabStrip>;
  let dirty = false;

  async function create(
    tabs: StripTab[],
    variant: 'titles' | 'icons' = 'titles',
  ): Promise<void> {
    TestBed.configureTestingModule({
      providers: [
        provideTransloco({
          config: {
            availableLangs: ['en', 'de'],
            defaultLang: 'en',
            reRenderOnLangChange: true,
            missingHandler: { logMissingKey: false },
          },
          loader: Bundles,
        }),
        {
          provide: RetainedViewStash,
          useValue: {
            version: signal(0),
            keyedInstances: () => [],
            instancesFor: () => (dirty ? [{ surfaceDirty: () => true }] : []),
          },
        },
      ],
    });
    fixture = TestBed.createComponent(PaneTabStrip);
    fixture.componentRef.setInput('tabs', tabs);
    fixture.componentRef.setInput('activeId', tabs[0]?.path ?? '');
    fixture.componentRef.setInput('source', { dock: 'content', paneId: 'main' });
    fixture.componentRef.setInput('variant', variant);
    fixture.detectChanges();
    await settle();
  }

  async function settle(): Promise<void> {
    for (let turn = 0; turn < 3; turn += 1) {
      await new Promise((resolve) => setTimeout(resolve, 0));
      fixture.detectChanges();
    }
  }

  function tabElement(): HTMLElement | null {
    return (fixture.nativeElement as HTMLElement).querySelector('[role="tab"]');
  }

  function badgeElement(): HTMLElement | null {
    return (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="tab-badge"]',
    );
  }

  beforeEach(() => {
    dirty = false;
  });

  it('stands after the title, in its tone, hidden from assistive technology', async () => {
    await create([tab({ badge: DEVELOPER })]);

    const badge = badgeElement();
    expect(badge?.textContent?.trim()).toBe('Developer');
    expect(badge?.classList).toContain('lw-badge--brand');
    expect(badge?.getAttribute('aria-hidden')).toBe('true');
    expect(badge?.previousElementSibling?.textContent?.trim()).toBe('Advanced');
  });

  it('is announced with the title', async () => {
    await create([tab({ badge: DEVELOPER })]);

    expect(tabElement()?.getAttribute('aria-label')).toBe('Advanced, Developer');
  });

  it('stays inside the name that says the tab holds unsaved work', async () => {
    dirty = true;
    await create([tab({ badge: DEVELOPER })]);

    expect(tabElement()?.getAttribute('aria-label')).toContain(
      'Advanced, Developer',
    );
  });

  it('is not a stop of its own', async () => {
    await create([tab({ badge: DEVELOPER })]);

    const focusable = badgeElement()?.querySelectorAll(
      'button, [href], [tabindex]',
    );
    expect(badgeElement()?.hasAttribute('tabindex')).toBe(false);
    expect(focusable?.length ?? 0).toBe(0);
  });

  it('shows a literal as it is', async () => {
    await create([tab({ badge: { text: 'Beta', textIsLiteral: true } })]);

    expect(badgeElement()?.textContent?.trim()).toBe('Beta');
    expect(tabElement()?.getAttribute('aria-label')).toBe('Advanced, Beta');
  });

  it('draws nothing for a badge with neither text nor icon', async () => {
    await create([tab({ badge: {} })]);

    expect(badgeElement()).toBeNull();
    expect(tabElement()?.getAttribute('aria-label')).toBe('Advanced');
  });

  it('follows a change of language', async () => {
    await create([tab({ badge: DEVELOPER })]);

    TestBed.inject(TranslocoService).setActiveLang('de');
    await settle();

    expect(badgeElement()?.textContent?.trim()).toBe('Entwicklung');
    expect(tabElement()?.getAttribute('aria-label')).toBe(
      'Erweitert, Entwicklung',
    );
  });

  function tooltipText(): string | undefined {
    const tooltip = tabElement()?.querySelector('lw-tooltip') as
      | (HTMLElement & { text?: string })
      | null;
    return tooltip?.getAttribute('text') ?? tooltip?.text;
  }

  it('is in the tooltip of a strip of titles, after the title', async () => {
    await create([tab({ badge: DEVELOPER })]);

    expect(tooltipText()).toBe('Advanced, Developer');
  });

  it('stands before the preview hint in the tooltip of a preview', async () => {
    await create([tab({ badge: DEVELOPER, preview: true })]);

    expect(tooltipText()).toBe('Advanced, Developer — double-click to keep');
  });

  it('moves into the tooltip and the name in a strip of icons', async () => {
    await create([tab({ badge: DEVELOPER, icon: 'assistant' })], 'icons');

    expect(badgeElement()).toBeNull();
    expect(tabElement()?.getAttribute('aria-label')).toBe('Advanced, Developer');
    expect(
      tabElement()?.querySelector('lw-tooltip')?.getAttribute('text') ??
        (tabElement()?.querySelector('lw-tooltip') as { text?: string } | null)
          ?.text,
    ).toBe('Advanced, Developer');
  });
});

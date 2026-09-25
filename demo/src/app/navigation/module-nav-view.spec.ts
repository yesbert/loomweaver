import { type WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { type PluginContext } from '@loomweaver/plugin-sdk';
import { ContributionRegistry, defineLwNavTree } from '@loomweaver/shell';
import { MODULES } from './module-tree';
import { ModuleNavView } from './module-nav-view';
import { navigationActions } from './navigation-actions';

const EVERY_PATH: readonly string[] = MODULES.flatMap((module) =>
  module.areas.flatMap((area) => area.views.map((view) => view.path)),
);

defineLwNavTree();

const langs = {
  en: {
    product: {
      module: { overview: 'Overview', sales: 'Sales', finance: 'Finance' },
      area: { customers: 'Customers', orderHandling: 'Order handling' },
      view: { customerList: 'Customer list', contactHistory: 'Contact history', quotes: 'Quotes' },
    },
  },
};

interface Recorder {
  readonly navigated: string[];
  readonly retitled: [string, string][];
}

function bindAt(path: string): Recorder {
  const navigated: string[] = [];
  const retitled: [string, string][] = [];
  navigationActions.bind({
    activeContent: () => ({ surfaceId: null, path, params: {} }),
    isShowingUnder: (named: string) =>
      path === named || path.startsWith(`${named}/`),
    navigateContent: (next: string) => navigated.push(next),
    retitleSurface: (id: string, title: string) => retitled.push([id, title]),
    registerSurface: () => ({ dispose: () => undefined }),
  } as unknown as PluginContext);
  return { navigated, retitled };
}

function bindAtSignal(path: WritableSignal<string>): void {
  navigationActions.bind({
    activeContent: () => ({ surfaceId: null, path: path(), params: {} }),
    isShowingUnder: (named: string) =>
      path() === named || path().startsWith(`${named}/`),
    navigateContent: () => undefined,
    retitleSurface: () => undefined,
    registerSurface: () => ({ dispose: () => undefined }),
  } as unknown as PluginContext);
}

function renderFixture(reachable: readonly string[] = EVERY_PATH) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [
      TranslocoTestingModule.forRoot({
        langs,
        translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
        preloadLangs: true,
      }),
    ],
    providers: [
      {
        provide: ContributionRegistry,
        useValue: {
          contentRoutes: signal(reachable.map((path) => ({ path }))),
        },
      },
    ],
  });
  const fixture = TestBed.createComponent(ModuleNavView);
  fixture.detectChanges();
  return fixture;
}

function render(reachable?: readonly string[]): HTMLElement {
  return renderFixture(reachable).nativeElement as HTMLElement;
}

async function renderMarked(): Promise<HTMLElement> {
  const element = render();
  await Promise.resolve();
  return element;
}

function heading(element: HTMLElement, area: string): HTMLButtonElement {
  return element.querySelector(
    `[data-nav-area="${area}"] .lw-nav-group-heading`,
  ) as HTMLButtonElement;
}

function shownViews(element: HTMLElement, area?: string): (string | null)[] {
  const scope = area
    ? (element.querySelector(`[data-nav-area="${area}"]`) as HTMLElement | null)
    : element;
  if (scope === null) {
    return [];
  }
  return [...scope.querySelectorAll('[data-nav-view]')]
    .filter((view) => {
      const group = view.closest('[data-nav-area]') as HTMLElement | null;
      return group === null || group.dataset['open'] !== 'false';
    })
    .map((view) => view.getAttribute('data-nav-view'));
}

function areasOf(element: HTMLElement): (string | null)[] {
  return [...element.querySelectorAll('[data-nav-area]')].map((area) =>
    area.getAttribute('data-nav-area'),
  );
}

describe('ModuleNavView', () => {
  afterEach(() => navigationActions.unbind());

  it('draws the areas of the module the content belongs to', () => {
    bindAt('sales/customers');

    expect(areasOf(render())).toEqual(['customers', 'orderHandling']);
  });

  it('follows the content into another module', () => {
    bindAt('finance/matching');

    expect(areasOf(render())).toContain('matching');
  });

  it('marks the view that is open', async () => {
    bindAt('sales/contacts');
    const element = await renderMarked();

    const marked = [...element.querySelectorAll('[aria-current="page"]')].map(
      (button) => button.getAttribute('data-nav-view'),
    );

    expect(marked).toEqual(['sales/contacts']);
  });

  it('marks the view a deep link sits under, not only its own address', async () => {
    bindAt('sales/quotes/q-0006');
    const element = await renderMarked();

    const marked = [...element.querySelectorAll('[aria-current="page"]')].map(
      (button) => button.getAttribute('data-nav-view'),
    );

    expect(marked).toEqual(['sales/quotes']);
  });

  it('does not mark a neighbour whose address merely starts the same way', async () => {
    bindAt('sales/contacts');
    const element = await renderMarked();

    const marked = [...element.querySelectorAll('[aria-current="page"]')].map(
      (button) => button.getAttribute('data-nav-view'),
    );

    expect(marked).toEqual(['sales/contacts']);
  });

  it('opens a view by its address', () => {
    const recorder = bindAt('sales/customers');
    const element = render();

    element
      .querySelector<HTMLButtonElement>('[data-nav-view="sales/quotes"]')
      ?.click();

    expect(recorder.navigated).toEqual(['sales/quotes']);
  });

  it('draws no tree at all for a module without areas', () => {
    bindAt('');
    const element = render();

    expect(element.querySelector('[data-testid="module-nav"]')).toBeNull();
  });

  it('keeps the module it is showing when the content belongs to none', () => {
    const path = signal('sales/customers');
    bindAtSignal(path);
    const fixture = renderFixture();
    const element = fixture.nativeElement as HTMLElement;

    expect(areasOf(element)).toEqual(['customers', 'orderHandling']);

    path.set('overview');
    fixture.detectChanges();

    expect(areasOf(element)).toEqual(['customers', 'orderHandling']);
    expect(shownViews(element)).not.toContain('overview');
  });

  it('starts an area closed when the module declares it so', async () => {
    bindAt('finance/matching');
    const element = await renderMarked();

    const collapsed = heading(element, 'matching');

    expect(collapsed.getAttribute('aria-expanded')).toBe('false');
    expect(shownViews(element, 'matching')).toEqual([]);
  });

  it('opens a declared-closed area when the user asks', async () => {
    bindAt('finance/matching');
    const fixture = renderFixture();
    const element = fixture.nativeElement as HTMLElement;
    await Promise.resolve();

    heading(element, 'matching').click();

    expect(heading(element, 'matching').getAttribute('aria-expanded')).toBe('true');
    expect(shownViews(element, 'matching')).toEqual(['finance/matching']);

    heading(element, 'matching').click();
  });

  it('renames its own surface to the area the visitor is in, through the contract', () => {
    const recorder = bindAt('sales/quotes/q-0006');
    render();

    expect(recorder.retitled).toEqual([['navigation.sales', 'product.area.orderHandling']]);
  });

  it('draws an entry only while its address is reachable', () => {
    bindAt('sales/customers');

    const element = render(EVERY_PATH.filter((path) => path !== 'sales/quotes'));

    expect(shownViews(element)).toEqual(['sales/customers', 'sales/contacts']);
  });

  it('draws no area once its last entry is gone', () => {
    bindAt('sales/customers');

    const element = render(EVERY_PATH.filter((path) => path !== 'sales/quotes'));

    expect(areasOf(element)).toEqual(['customers']);
  });

  it('draws no tree at all once every area of the module has fallen away', () => {
    bindAt('sales/customers');

    const element = render(
      EVERY_PATH.filter((path) => !path.startsWith('sales/')),
    );

    expect(element.querySelector('[data-testid="module-nav"]')).toBeNull();
  });
});

import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { type PluginContext } from '@loomweaver/plugin-sdk';
import { defineLwNavTree } from '@loomweaver/shell';
import { ModuleNavView } from './module-nav-view';
import { navigationActions } from './navigation-actions';

defineLwNavTree();

const langs = {
  en: {
    product: {
      module: { overview: 'Overview', sales: 'Sales', finance: 'Finance' },
      area: { customers: 'Customers', orderHandling: 'Order handling' },
      view: { customerList: 'Customer list', contactHistory: 'Contact history', quotes: 'Quotes' },
      nav: { notYet: 'Waiting for content.' },
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

function renderFixture() {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [
      TranslocoTestingModule.forRoot({
        langs,
        translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
        preloadLangs: true,
      }),
    ],
  });
  const fixture = TestBed.createComponent(ModuleNavView);
  fixture.detectChanges();
  return fixture;
}

function render(): HTMLElement {
  return renderFixture().nativeElement as HTMLElement;
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

function shownViews(element: HTMLElement): (string | null)[] {
  return [...element.querySelectorAll('[data-nav-view]')]
    .filter((view) => (view as HTMLElement).offsetParent !== null || true)
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

  it('starts an area closed when the module declares it so', () => {
    bindAt('finance/matching');
    const element = render();

    const collapsed = heading(element, 'matching');

    expect(collapsed.getAttribute('aria-expanded')).toBe('false');
    expect(shownViews(element)).toEqual([]);
  });

  it('opens a declared-closed area when the user asks', () => {
    bindAt('finance/matching');
    const fixture = renderFixture();
    const element = fixture.nativeElement as HTMLElement;

    heading(element, 'matching').click();

    expect(heading(element, 'matching').getAttribute('aria-expanded')).toBe('true');
    expect(shownViews(element)).toEqual(['finance/matching']);

    heading(element, 'matching').click();
  });

  it('renames its own surface to the area the visitor is in, through the contract', () => {
    const recorder = bindAt('sales/quotes/q-0006');
    render();

    expect(recorder.retitled).toEqual([['navigation.sales', 'product.area.orderHandling']]);
  });

  it('says once, not per area, that an area is still waiting for content', () => {
    bindAt('finance/matching');
    const element = render();

    expect(element.querySelectorAll('[data-testid="nav-waiting"]').length).toBe(1);
  });
});

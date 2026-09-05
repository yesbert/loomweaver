import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { type PluginContext } from '@loomweaver/plugin-sdk';
import { ModuleNavView } from './module-nav-view';
import { navigationActions } from './navigation-actions';

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
}

function bindAt(path: string): Recorder {
  const navigated: string[] = [];
  navigationActions.bind(
    {
      activeContent: () => ({ surfaceId: null, path, params: {} }),
      navigateContent: (next: string) => navigated.push(next),
      registerSurface: () => ({ dispose: () => undefined }),
    } as unknown as PluginContext,
    ModuleNavView,
  );
  return { navigated };
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

  it('marks the view that is open', () => {
    bindAt('sales/contacts');
    const element = render();

    const marked = [...element.querySelectorAll('[aria-current="page"]')].map(
      (button) => button.getAttribute('data-nav-view'),
    );

    expect(marked).toEqual(['sales/contacts']);
  });

  it('marks the view a deep link sits under, not only its own address', () => {
    bindAt('sales/quotes/q-0006');
    const element = render();

    const marked = [...element.querySelectorAll('[aria-current="page"]')].map(
      (button) => button.getAttribute('data-nav-view'),
    );

    expect(marked).toEqual(['sales/quotes']);
  });

  it('does not mark a neighbour whose address merely starts the same way', () => {
    bindAt('sales/contacts');
    const element = render();

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

    const collapsed = element.querySelector(
      '[data-nav-toggle="matching"]',
    ) as HTMLButtonElement;

    expect(collapsed.getAttribute('aria-expanded')).toBe('false');
    expect(element.querySelectorAll('[data-nav-view]').length).toBe(0);
  });

  it('opens a declared-closed area when the user asks', () => {
    bindAt('finance/matching');
    const fixture = renderFixture();
    const element = fixture.nativeElement as HTMLElement;

    (
      element.querySelector('[data-nav-toggle="matching"]') as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    expect(
      element
        .querySelector('[data-nav-toggle="matching"]')
        ?.getAttribute('aria-expanded'),
    ).toBe('true');
    expect(element.querySelectorAll('[data-nav-view]').length).toBe(1);
  });

  it('says once, not per area, that an area is still waiting for content', () => {
    bindAt('finance/matching');
    const element = render();

    expect(element.querySelectorAll('[data-testid="nav-waiting"]').length).toBe(1);
  });
});

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

function render(): HTMLElement {
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
  return fixture.nativeElement as HTMLElement;
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

  it('says once, not per area, that an area is still waiting for content', () => {
    bindAt('finance/matching');
    const element = render();

    expect(element.querySelectorAll('[data-testid="nav-waiting"]').length).toBe(1);
  });
});

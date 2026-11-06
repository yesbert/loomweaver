import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { FailedPluginContent } from '../../../plugin/failed-plugin-content';
import { RouteUnavailableView } from './route-unavailable-view';

const STRINGS = {
  route: {
    unavailableTitle: 'View not available',
    unavailableMessage: 'This view does not exist in this application.',
    pluginFailedMessage: 'The plugin that provides this view could not be loaded.',
    pluginUnloadedTitle: 'The plugin could not be loaded',
    pluginUnloadedMessage: '{{name}} provides this view and did not start.',
    tryAgain: 'Try again',
  },
};

function shown(path: string) {
  TestBed.configureTestingModule({
    imports: [
      TranslocoTestingModule.forRoot({
        langs: { en: STRINGS },
        translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
        preloadLangs: true,
      }),
    ],
  });
  const retry = vi.fn();
  TestBed.inject(FailedPluginContent).rememberAddresses(
    'docs',
    ['docs/:id', 'view:docs.outline'],
    { name: 'Team docs', retry },
  );
  const fixture = TestBed.createComponent(RouteUnavailableView);
  fixture.componentRef.setInput('path', path);
  fixture.detectChanges();
  return { element: fixture.nativeElement as HTMLElement, retry };
}

describe('the placeholder where a view cannot be shown', () => {
  it('names the frame plugin that could not be loaded, and offers to try again', () => {
    const { element } = shown('docs/7');

    expect(element.textContent).toContain('The plugin could not be loaded');
    expect(element.textContent).toContain(
      'Team docs provides this view and did not start.',
    );
    expect(element.textContent).not.toContain('does not exist');
  });

  it('starts that plugin again when the user tries again', () => {
    const { element, retry } = shown('view:docs.outline');

    element.querySelector('button')?.click();

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('says the view does not exist only where nobody registered it', () => {
    const { element } = shown('elsewhere/7');

    expect(element.textContent).toContain('View not available');
    expect(element.textContent).toContain('does not exist');
    expect(element.querySelector('button')).toBeNull();
  });
});

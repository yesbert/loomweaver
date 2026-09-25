import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { VersionService } from '@loomweaver/shell';
import { PreviewBadge } from './preview-badge';

function render(isPreview: boolean): HTMLElement {
  TestBed.configureTestingModule({
    imports: [
      TranslocoTestingModule.forRoot({
        langs: { en: { product: { preview: 'Preview' } } },
        translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
        preloadLangs: true,
      }),
    ],
  });
  TestBed.overrideProvider(VersionService, {
    useValue: { version: () => '0.8.0-preview.3', isPreview: () => isPreview },
  });
  const fixture = TestBed.createComponent(PreviewBadge);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('PreviewBadge', () => {
  it('says the product is a preview while the workbench is running one', () => {
    const element = render(true);

    expect(element.querySelector('[data-testid="preview-badge"]')?.textContent).toBe(
      'Preview',
    );
  });

  it('shows nothing on a released line', () => {
    expect(render(false).querySelector('[data-testid="preview-badge"]')).toBeNull();
  });
});

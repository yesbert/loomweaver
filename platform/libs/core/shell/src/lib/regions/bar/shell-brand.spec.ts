import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { PRODUCT_IDENTITY } from '@loomweaver/plugin-sdk';
import { ShellBrand } from './shell-brand';
import { ViewportService } from '../../layout/viewport.service';

function render(compact: boolean, pinned?: boolean): HTMLElement {
  TestBed.configureTestingModule({
    imports: [
      ShellBrand,
      TranslocoTestingModule.forRoot({
        langs: { en: { acme: { tagline: 'Weaves things' } } },
        translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
        preloadLangs: true,
      }),
    ],
    providers: [
      {
        provide: PRODUCT_IDENTITY,
        useValue: {
          name: 'Acme Loom',
          tagline: 'acme.tagline',
          logoUrl: '/acme.svg',
        },
      },
      { provide: ViewportService, useValue: { compact: signal(compact) } },
    ],
  });
  const fixture = TestBed.createComponent(ShellBrand);
  if (pinned !== undefined) {
    fixture.componentRef.setInput('compact', pinned);
  }
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('ShellBrand', () => {
  it('draws mark, name and tagline on a wide viewport, with the name beside the mark', () => {
    const host = render(false);

    expect(host.textContent).toContain('Acme Loom');
    expect(host.textContent).toContain('Weaves things');
    expect(host.querySelector('img')?.getAttribute('alt')).toBe('');
  });

  it('draws the mark alone on a narrow viewport, announced by the product name', () => {
    const host = render(true);

    expect(host.textContent).not.toContain('Acme Loom');
    expect(host.textContent).not.toContain('Weaves things');
    expect(host.querySelector('img')?.getAttribute('alt')).toBe('Acme Loom');
  });
});

describe('ShellBrand embedded by a distribution', () => {
  it('takes the narrow form where the caller pins it', () => {
    const host = render(false, true);

    expect(host.textContent).not.toContain('Acme Loom');
    expect(host.querySelector('img')?.getAttribute('alt')).toBe('Acme Loom');
  });

  it('follows the frame where the caller pins nothing', () => {
    expect(render(true).textContent).not.toContain('Acme Loom');
  });
});

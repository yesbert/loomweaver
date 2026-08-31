import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ContentRoute } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import {
  PaddingDefault,
  SURFACE_PADDING,
} from '../../foundation/surface-padding';
import { ContentArea } from './content-area';

@Component({ selector: 'lw-test-home', template: '<span>home</span>' })
class HomeView {}

const INSET = 'p-6';

async function mainAt(
  padding: PaddingDefault | undefined,
  declared: boolean | undefined,
): Promise<HTMLElement> {
  TestBed.configureTestingModule({
    imports: [
      TranslocoTestingModule.forRoot({
        langs: { en: {} },
        translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
        preloadLangs: true,
      }),
    ],
    providers: [
      provideRouter([]),
      ...(padding === undefined
        ? []
        : [{ provide: SURFACE_PADDING, useValue: padding }]),
    ],
  });
  const route: ContentRoute = {
    path: '',
    component: HomeView,
    ...(declared !== undefined && { padded: declared }),
  };
  TestBed.inject(ContributionRegistry).addContentRoute(route);

  const fixture = TestBed.createComponent(ContentArea);
  fixture.detectChanges();
  await fixture.whenStable();
  const main = (fixture.nativeElement as HTMLElement).querySelector(
    '#lw-main-content',
  );
  if (main === null) {
    throw new Error('the content area rendered no main element');
  }
  return main as HTMLElement;
}

describe('ContentArea — the inset a surface gets at its address', () => {
  it('leaves a surface flush where neither it nor the product asks for an inset', async () => {
    expect((await mainAt(undefined, undefined)).classList).not.toContain(INSET);
  });

  it('insets a surface where the product asks for it and the surface says nothing', async () => {
    expect((await mainAt('inset', undefined)).classList).toContain(INSET);
  });

  it('insets a surface that asks for it although the product asks for none', async () => {
    expect((await mainAt('none', true)).classList).toContain(INSET);
  });

  it('leaves flush a surface that asks for it although the product insets', async () => {
    expect((await mainAt('inset', false)).classList).not.toContain(INSET);
  });
});

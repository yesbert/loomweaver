import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { TestbedInfoView } from './testbed-info-view';

function transloco() {
  return TranslocoTestingModule.forRoot({
    langs: {
      en: {
        testbed: {
          info: { assigned: 'Assigned to U1', median: 'Median wait' },
        },
      },
    },
    translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
    preloadLangs: true,
  });
}

describe('TestbedInfoView', () => {
  it('renders its facts as a definition list', () => {
    TestBed.configureTestingModule({ imports: [TestbedInfoView, transloco()] });
    const fixture = TestBed.createComponent(TestbedInfoView);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelectorAll('dt')).toHaveLength(5);
    expect(host.textContent).toContain('Assigned to U1');
    expect(host.textContent).toContain('Median wait');
    expect(
      host
        .querySelector('[data-testid="testbed-session"]')
        ?.textContent?.trim(),
    ).toBe('signed out');
    expect(
      host
        .querySelector('[data-testid="testbed-active-content"]')
        ?.textContent?.trim(),
    ).toBe('none');
  });
});

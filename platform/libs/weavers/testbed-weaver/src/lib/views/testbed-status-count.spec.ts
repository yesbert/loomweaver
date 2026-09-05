import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { TestbedStatusCount } from './testbed-status-count';
import { testbedNavState } from './navigation/testbed-nav-state';

function transloco() {
  return TranslocoTestingModule.forRoot({
    langs: { en: { testbed: { status: { items: 'items' } } } },
    translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
    preloadLangs: true,
  });
}

function render() {
  TestBed.configureTestingModule({ imports: [TestbedStatusCount, transloco()] });
  const fixture = TestBed.createComponent(TestbedStatusCount);
  fixture.detectChanges();
  return fixture;
}

describe('TestbedStatusCount', () => {
  beforeEach(() => testbedNavState.reset());

  it('shows the live item count from the shared nav state', () => {
    const fixture = render();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      '3 items',
    );
  });

  it('reflects additions reactively', () => {
    const fixture = render();
    testbedNavState.add();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      '4 items',
    );
  });
});

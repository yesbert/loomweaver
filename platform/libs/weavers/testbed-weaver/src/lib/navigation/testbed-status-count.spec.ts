import { TestBed } from '@angular/core/testing';
import { TestbedStatusCount } from './testbed-status-count';
import { testbedNavState } from './testbed-nav-state';
import { translocoForSpec } from '../test-transloco';

const EN = { testbed: { status: { items: 'items' } } };

function render() {
  TestBed.configureTestingModule({
    imports: [TestbedStatusCount, translocoForSpec(EN)],
  });
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

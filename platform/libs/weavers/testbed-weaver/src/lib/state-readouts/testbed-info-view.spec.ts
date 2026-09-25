import { TestBed } from '@angular/core/testing';
import { TestbedInfoView } from './testbed-info-view';
import { translocoForSpec } from '../test-transloco';

const EN = {
  testbed: {
    info: { assigned: 'Assigned to U1', median: 'Median wait' },
  },
};

describe('TestbedInfoView', () => {
  it('renders its facts as a definition list', () => {
    TestBed.configureTestingModule({
      imports: [TestbedInfoView, translocoForSpec(EN)],
    });
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

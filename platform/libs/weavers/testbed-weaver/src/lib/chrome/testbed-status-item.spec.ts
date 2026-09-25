import { TestBed } from '@angular/core/testing';
import { TestbedStatusItem } from './testbed-status-item';
import { translocoForSpec } from '../test-transloco';

const EN = { testbed: { status: { ready: 'Ready' } } };

describe('TestbedStatusItem', () => {
  it('renders the ready status label from the testbed namespace', () => {
    TestBed.configureTestingModule({
      imports: [TestbedStatusItem, translocoForSpec(EN)],
    });
    const fixture = TestBed.createComponent(TestbedStatusItem);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent?.trim()).toBe(
      'Ready',
    );
  });
});

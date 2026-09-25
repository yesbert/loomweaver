import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { TestbedStatusItem } from './testbed-status-item';

function transloco() {
  return TranslocoTestingModule.forRoot({
    langs: { en: { testbed: { status: { ready: 'Ready' } } } },
    translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
    preloadLangs: true,
  });
}

describe('TestbedStatusItem', () => {
  it('renders the ready status label from the demo namespace', () => {
    TestBed.configureTestingModule({ imports: [TestbedStatusItem, transloco()] });
    const fixture = TestBed.createComponent(TestbedStatusItem);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent?.trim()).toBe(
      'Ready',
    );
  });
});

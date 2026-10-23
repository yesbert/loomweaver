import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { View } from './view';
import { ViewInstanceService } from './view-instance.service';
import { ViewInstanceSwitcher } from './view-instance-switcher';

function transloco() {
  return TranslocoTestingModule.forRoot({
    langs: {
      en: { viewInstance: { default: 'Default', switcher: 'Saved views' } },
    },
    translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
    preloadLangs: true,
  });
}

function render() {
  TestBed.configureTestingModule({
    imports: [ViewInstanceSwitcher, transloco()],
  });
  const fixture = TestBed.createComponent(ViewInstanceSwitcher);
  fixture.componentRef.setInput('view', { id: 'v', title: 'Entries' } as View);
  fixture.detectChanges();
  return fixture;
}

function switcherOf(host: HTMLElement): HTMLButtonElement {
  return host.querySelector(
    '[data-testid="view-switcher"]',
  ) as HTMLButtonElement;
}

describe('ViewInstanceSwitcher', () => {
  beforeEach(() => localStorage.clear());

  it('is named by the default view it shows, then by what it is', () => {
    const fixture = render();

    expect(switcherOf(fixture.nativeElement).getAttribute('aria-label')).toBe(
      'Default, Saved views',
    );
  });

  it('is named by the saved view it shows once one is active', () => {
    const fixture = render();

    TestBed.inject(ViewInstanceService).create('v', 'Open orders');
    fixture.detectChanges();

    const switcher = switcherOf(fixture.nativeElement);
    expect(switcher.textContent?.trim()).toBe('Open orders');
    expect(switcher.getAttribute('aria-label')).toBe(
      'Open orders, Saved views',
    );
  });
});

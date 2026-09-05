import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { TestbedNavView } from './testbed-nav-view';
import { testbedNavState } from './testbed-nav-state';

function transloco() {
  return TranslocoTestingModule.forRoot({
    langs: { en: { testbed: { nav: { scratch: 'Scratch note' } } } },
    translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
    preloadLangs: true,
  });
}

function render() {
  TestBed.configureTestingModule({ imports: [TestbedNavView, transloco()] });
  const fixture = TestBed.createComponent(TestbedNavView);
  fixture.detectChanges();
  return fixture;
}

describe('TestbedNavView', () => {
  beforeEach(() => testbedNavState.reset());

  it('lists the current nav items', () => {
    const host = render().nativeElement as HTMLElement;
    const rows = host.querySelectorAll('li');
    expect(rows).toHaveLength(3);
    expect(rows[0].textContent?.trim()).toBe('Item C');
  });

  it('renders added items reactively', () => {
    const fixture = render();
    testbedNavState.add();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('li')).toHaveLength(4);
  });
});

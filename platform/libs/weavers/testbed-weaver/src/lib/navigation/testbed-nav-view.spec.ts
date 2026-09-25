import { TestBed } from '@angular/core/testing';
import { TestbedNavView } from './testbed-nav-view';
import { testbedNavState } from './testbed-nav-state';
import { translocoForSpec } from '../test-transloco';

const EN = { testbed: { nav: { scratch: 'Scratch note' } } };

function render() {
  TestBed.configureTestingModule({
    imports: [TestbedNavView, translocoForSpec(EN)],
  });
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
    expect(
      (fixture.nativeElement as HTMLElement).querySelectorAll('li'),
    ).toHaveLength(4);
  });
});

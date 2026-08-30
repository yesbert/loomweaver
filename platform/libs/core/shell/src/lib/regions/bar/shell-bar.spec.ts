import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ShellBar } from './shell-bar';
import { BarItem } from '../../foundation/bar-item';
import { LayoutRegion } from '../../layout/layout';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { defineLwTooltip } from '../../elements/tooltip/lw-tooltip.element';

const topBar: LayoutRegion = { id: 'top-bar', type: 'bar', dock: 'top' };

beforeAll(() => defineLwTooltip());

function transloco() {
  return TranslocoTestingModule.forRoot({
    langs: { en: { status: { add: 'Add item' } } },
    translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
    preloadLangs: true,
  });
}

function render(...items: BarItem[]) {
  TestBed.configureTestingModule({ imports: [ShellBar, transloco()] });
  const registry = TestBed.inject(ContributionRegistry);
  for (const item of items) {
    registry.addBarItem(item);
  }
  const fixture = TestBed.createComponent(ShellBar);
  fixture.componentRef.setInput('region', topBar);
  fixture.detectChanges();
  return (fixture.nativeElement as HTMLElement).querySelectorAll('button');
}

describe('ShellBar', () => {
  it('drops a button that names neither an action nor a menu to open', () => {
    expect(
      render({
        id: 'dead',
        bar: 'top-bar',
        slot: 'end',
        icon: 'add',
        tooltip: 'status.add',
      }),
    ).toHaveLength(0);
  });

  it('draws a button whose purpose is the menu it opens', () => {
    expect(
      render({
        id: 'account',
        bar: 'top-bar',
        slot: 'end',
        icon: 'add',
        tooltip: 'status.add',
        menu: 'acme/account',
        menuTrigger: 'primary',
      }),
    ).toHaveLength(1);
  });
});

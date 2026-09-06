import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ShellBar } from './shell-bar';
import { BarItem } from '../../foundation/bar-item';
import { LayoutRegion } from '../../layout/layout';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { defineLwTooltip } from '../../elements/tooltip/lw-tooltip.element';

const topBar: LayoutRegion = { id: 'top-bar', type: 'bar', dock: 'top' };

@Component({ selector: 'lw-test-entry', template: 'Acme' })
class TestEntry {}

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

function renderHosts(...items: BarItem[]) {
  TestBed.configureTestingModule({ imports: [ShellBar, transloco()] });
  const registry = TestBed.inject(ContributionRegistry);
  for (const item of items) {
    registry.addBarItem(item);
  }
  const fixture = TestBed.createComponent(ShellBar);
  fixture.componentRef.setInput('region', topBar);
  fixture.detectChanges();
  return [
    ...(fixture.nativeElement as HTMLElement).querySelectorAll(
      'lw-shell-bar-item',
    ),
  ];
}

function widthOf(
  id: string | undefined,
  entryWidths: Record<string, number>,
  isFoldControl: boolean,
): number {
  if (id) {
    return entryWidths[id] ?? 0;
  }
  return isFoldControl ? 28 : 0;
}

function stubLayout(
  barWidth: number,
  entryWidths: Record<string, number>,
): () => void {
  const originalRect = HTMLElement.prototype.getBoundingClientRect;
  const originalClient = Object.getOwnPropertyDescriptor(
    Element.prototype,
    'clientWidth',
  );
  HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
    const id = this.dataset['barEntry'];
    const width = widthOf(id, entryWidths, this.hasAttribute('data-bar-fold'));
    return { width, right: width } as DOMRect;
  };
  Object.defineProperty(Element.prototype, 'clientWidth', {
    configurable: true,
    get(this: Element) {
      return this.tagName === 'HEADER' ? barWidth : 0;
    },
  });
  return () => {
    HTMLElement.prototype.getBoundingClientRect = originalRect;
    if (originalClient) {
      Object.defineProperty(Element.prototype, 'clientWidth', originalClient);
    }
  };
}

async function mount(...items: BarItem[]): Promise<ComponentFixture<ShellBar>> {
  TestBed.configureTestingModule({ imports: [ShellBar, transloco()] });
  const registry = TestBed.inject(ContributionRegistry);
  for (const item of items) {
    registry.addBarItem(item);
  }
  const fixture = TestBed.createComponent(ShellBar);
  fixture.componentRef.setInput('region', topBar);
  await fixture.whenStable();
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

function entriesInBar(fixture: ComponentFixture<ShellBar>): string[] {
  return [
    ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
      '[data-bar-entry]',
    ),
  ].map((host) => host.dataset['barEntry'] ?? '');
}

function entry(id: string, order: number): BarItem {
  return { id, bar: 'top-bar', slot: 'end', order, component: TestEntry };
}

describe('ShellBar folding', () => {
  let restore: () => void = () => undefined;

  afterEach(() => restore());

  it('shows no fold control while everything fits', async () => {
    restore = stubLayout(400, { a: 100, b: 100, c: 100 });
    const fixture = await mount(entry('a', 1), entry('b', 2), entry('c', 3));

    expect(entriesInBar(fixture)).toEqual(['a', 'b', 'c']);
    expect(fixture.nativeElement.querySelector('[data-bar-fold]')).toBeNull();
  });

  it('folds the last entry into a control at the end when the bar is too narrow', async () => {
    restore = stubLayout(250, { a: 100, b: 100, c: 100 });
    const fixture = await mount(entry('a', 1), entry('b', 2), entry('c', 3));

    expect(entriesInBar(fixture)).toEqual(['a', 'b']);
    const control = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-bar-fold]',
    );
    expect(control?.getAttribute('aria-expanded')).toBe('false');
  });

  it('presents the folded entries in a tray, as themselves, and closes on Escape', async () => {
    restore = stubLayout(250, { a: 100, b: 100, c: 100 });
    const fixture = await mount(entry('a', 1), entry('b', 2), entry('c', 3));
    const host = fixture.nativeElement as HTMLElement;

    host.querySelector<HTMLButtonElement>('[data-bar-fold]')?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const tray = host.querySelector<HTMLElement>('[role="group"]');
    expect(tray?.querySelectorAll('lw-test-entry')).toHaveLength(1);
    expect(entriesInBar(fixture)).toEqual(['a', 'b']);
    expect(
      host.querySelector('[data-bar-fold]')?.getAttribute('aria-expanded'),
    ).toBe('true');

    tray?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.querySelector('[role="group"]')).toBeNull();
  });
});

describe('ShellBar', () => {
  it('lets an entry shrink, so one that shortens itself can', () => {
    const [host] = renderHosts({
      id: 'brand',
      bar: 'top-bar',
      slot: 'start',
      component: TestEntry,
    });

    expect(host.classList.contains('min-w-0')).toBe(true);
  });

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

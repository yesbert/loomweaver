import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { DialogOutlet } from './dialog-outlet';
import { DialogService } from './dialog.service';
import { MenuService } from '../menu/menu.service';
import { defineLwMenu, LW_MENU_TAG } from '../elements/menu/lw-menu.element';

defineLwMenu();

const MENU_STYLES = 'libs/core/shell/src/lib/styles/theme/lw-menu.css';

@Component({ template: '<button type="button" id="more">More</button>' })
class Body {}

function layerOf(classes: string): number {
  const layer = /(?:^|\s)z-\[?(\d+)\]?(?:\s|;|$)/.exec(classes);
  if (!layer) {
    throw new Error(`No layer in "${classes}"`);
  }
  return Number(layer[1]);
}

function tick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

async function setup() {
  TestBed.configureTestingModule({
    imports: [
      DialogOutlet,
      TranslocoTestingModule.forRoot({
        langs: { en: { dialog: { close: 'Close' } } },
        translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
        preloadLangs: true,
      }),
    ],
  });
  const dialogs = TestBed.inject(DialogService);
  const menus = TestBed.inject(MenuService);
  const fixture = TestBed.createComponent(DialogOutlet);
  const host = fixture.nativeElement as HTMLElement;
  document.body.append(host);
  dialogs.open(Body, { title: 't' });
  fixture.detectChanges();
  await tick();
  const more = host.querySelector<HTMLButtonElement>('#more') as HTMLButtonElement;
  more.focus();
  menus.openList(
    [
      { key: 'one', label: 'One' },
      { key: 'two', label: 'Two' },
    ],
    { x: 0, y: 0 },
    () => undefined,
    more,
  );
  await tick();
  const menu = document.body.querySelector<HTMLElement>(LW_MENU_TAG);
  return { host, more, menu, menus, fixture };
}

describe('a menu opened from inside a dialog', () => {
  afterEach(() => {
    TestBed.inject(MenuService).close();
    document.body.replaceChildren();
  });

  it('keeps the focus the dialog would otherwise pull back', async () => {
    const t = await setup();

    expect(t.menu).not.toBeNull();
    expect(t.menu?.contains(document.activeElement)).toBe(true);
  });

  it('moves through its entries with the arrow keys', async () => {
    const t = await setup();

    t.menu?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
    );

    expect(document.activeElement?.getAttribute('command')).toBe('one');
  });

  it('closes alone on Escape and hands the focus back to its opener', async () => {
    const t = await setup();

    (document.activeElement as HTMLElement).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    t.fixture.detectChanges();
    await tick();
    t.fixture.detectChanges();

    expect(document.body.querySelector(LW_MENU_TAG)).toBeNull();
    expect(t.host.querySelector('dialog')).not.toBeNull();
    expect(document.activeElement).toBe(t.more);
  });

  it('is drawn on a layer above the dialog', async () => {
    const t = await setup();
    const styles = readFileSync(join(process.cwd(), MENU_STYLES), 'utf8');
    const menuRule = /lw-menu \{[^}]*\}/.exec(styles)?.[0] ?? '';
    const dialogLayer = t.host.querySelector('dialog')?.parentElement?.className ?? '';

    expect(layerOf(menuRule)).toBeGreaterThan(layerOf(dialogLayer));
  });
});

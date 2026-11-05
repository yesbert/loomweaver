import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { CommandPalette } from './command-palette';
import { ContributionRegistry } from '../../contributions/contribution-registry';
import { DialogOutlet } from '../../dialog/dialog-outlet';
import { DialogService } from '../../dialog/dialog.service';
import { MenuService } from '../../menu/menu.service';
import { ContentTabsService } from '../../regions/content/tabs/content-tabs.service';
import { QuickOpenTarget } from '../../regions/content/tabs/quick-open-target';
import { TAB_CONTEXT_MENU } from '../../regions/content/tabs/tab-context-menu';
import { defineLwMenu, LW_MENU_TAG } from '../../elements/menu/lw-menu.element';

defineLwMenu();

const OPEN_WORK: readonly QuickOpenTarget[] = [
  {
    path: 'doc/one',
    navPath: 'doc/one',
    title: 'A note',
    literalTitle: true,
    pinned: false,
    closable: true,
    lastActive: 1000,
  },
];

function tick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

async function askForTheActions() {
  TestBed.configureTestingModule({
    imports: [
      DialogOutlet,
      TranslocoTestingModule.forRoot({
        langs: { en: { dialog: { close: 'Close' }, cmd: { close: 'Close tab' } } },
        translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
        preloadLangs: true,
      }),
    ],
    providers: [
      {
        provide: ContentTabsService,
        useValue: { quickOpenTargets: signal(OPEN_WORK), revealContentTab: () => undefined },
      },
    ],
  });
  const registry = TestBed.inject(ContributionRegistry);
  registry.addCommand({ id: 'tab.close', title: 'cmd.close', run: () => undefined });
  registry.addMenuItem({ menu: TAB_CONTEXT_MENU, command: 'tab.close' });
  const fixture = TestBed.createComponent(DialogOutlet);
  const host = fixture.nativeElement as HTMLElement;
  const opener = document.createElement('button');
  document.body.append(opener, host);
  opener.focus();
  TestBed.inject(DialogService).open(CommandPalette, {
    bare: true,
    title: 'palette.quickOpenTitle',
    data: { mode: 'tabs' },
  });
  fixture.detectChanges();
  await tick();
  const field = host.querySelector('input') as HTMLInputElement;
  field.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
  );
  await tick();
  fixture.detectChanges();
  await tick();
  fixture.detectChanges();
  return { host, opener, field };
}

describe('the actions of open work, asked for in the search', () => {
  afterEach(() => {
    TestBed.inject(MenuService).close();
    document.body.replaceChildren();
  });

  it('close the search', async () => {
    const t = await askForTheActions();

    expect(t.field.isConnected).toBe(false);
    expect(t.host.querySelector('dialog')).toBeNull();
  });

  it('keep the keyboard once the search has closed', async () => {
    await askForTheActions();
    const menu = document.body.querySelector<HTMLElement>(LW_MENU_TAG);

    expect(menu).not.toBeNull();
    expect(menu?.contains(document.activeElement)).toBe(true);
  });

  it('hand the focus to what opened the search when they are dismissed', async () => {
    const t = await askForTheActions();

    (document.activeElement as HTMLElement).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );

    expect(document.body.querySelector(LW_MENU_TAG)).toBeNull();
    expect(document.activeElement).toBe(t.opener);
  });
});

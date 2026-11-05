import { Component, Provider, signal, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  TranslocoTestingModule,
  TranslocoTestingOptions,
} from '@jsverse/transloco';
import { Shell } from './shell';
import { DEFAULT_BAR_ITEMS } from './regions/bar/default-bar-items';
import { ContributionRegistry } from './contributions/contribution-registry';
import { provideLayout } from './layout/layout';
import { NotificationService } from './notifications/notification.service';
import { DRAW_TOASTS } from './notifications/toast-options';
import { FeatureSwitches } from './features/feature-switches.service';
import { SidebarService } from './regions/panel/sidebar.service';
import { PanelGroupService } from './regions/panel/panel-group.service';
import { PanelState } from './regions/panel/panel-state';
import { ViewportService } from './layout/viewport.service';
import { DialogService } from './dialog/dialog.service';
import { MenuService } from './menu/menu.service';
import { defineLwMenu, LW_MENU_TAG } from './elements/menu/lw-menu.element';

defineLwMenu();

function translocoTesting(options: TranslocoTestingOptions = {}) {
  return TranslocoTestingModule.forRoot({
    langs: {
      en: {
        shell: { tagline: 'Plugin & UI platform — the loom' },
        theme: {
          label: 'Theme',
          light: 'Light',
          dark: 'Dark',
          system: 'System',
        },
        language: { label: 'Language' },
      },
    },
    translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
    preloadLangs: true,
    ...options,
  });
}

describe('Shell', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Shell, translocoTesting()],
      providers: [provideRouter([])],
    }).compileComponents();

    const registry = TestBed.inject(ContributionRegistry);
    for (const item of DEFAULT_BAR_ITEMS) {
      registry.addBarItem(item);
    }
  });

  it('renders the LoomWeaver shell brand', async () => {
    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[role="banner"]')?.textContent).toContain(
      'LoomWeaver',
    );
  });

  it('draws one banner, one main and one content-info region, each named', async () => {
    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('[role="banner"]')).toHaveLength(1);
    expect(compiled.querySelectorAll('header')).toHaveLength(0);
    expect(compiled.querySelectorAll('main')).toHaveLength(1);
    expect(compiled.querySelectorAll('footer')).toHaveLength(1);
    for (const landmark of compiled.querySelectorAll(
      '[role="banner"], main, footer',
    )) {
      expect(landmark.getAttribute('aria-label')).toBeTruthy();
    }
  });

  it('moves the focus to the working area without following the link', async () => {
    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    document.body.append(compiled);
    const skip = compiled.querySelector<HTMLAnchorElement>(
      'a[href="#lw-main-content"]',
    );
    const target = compiled.querySelector<HTMLElement>('#lw-main-content');
    expect(skip).not.toBeNull();
    expect(target).not.toBeNull();

    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    skip?.dispatchEvent(click);

    expect(click.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(target);
    compiled.remove();
  });
});

describe('Shell toasts', () => {
  async function shellWith(providers: Provider[]) {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Shell, translocoTesting()],
      providers: [provideRouter([]), ...providers],
    }).compileComponents();
    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('mounts the toast outlet where the distribution says nothing', async () => {
    const shell = await shellWith([]);
    expect(shell.querySelector('lw-toasts')).not.toBeNull();
  });

  it('mounts no toast outlet where the distribution draws toasts itself', async () => {
    const shell = await shellWith([{ provide: DRAW_TOASTS, useValue: false }]);
    expect(shell.querySelector('lw-toasts')).toBeNull();
  });

  it('keeps raised toasts readable where the distribution draws them', async () => {
    await shellWith([{ provide: DRAW_TOASTS, useValue: false }]);
    const toasts = TestBed.inject(NotificationService);

    toasts.show({ message: 'Saved', kind: 'success' });

    expect(toasts.notifications()).toMatchObject([
      { message: 'Saved', kind: 'success', count: 1 },
    ]);
  });
});

describe('Shell sidebar footer', () => {
  beforeEach(() => localStorage.clear());

  it('renders a bar docked to a side as a footer holding its items', async () => {
    await TestBed.configureTestingModule({
      imports: [Shell, translocoTesting()],
      providers: [
        provideRouter([]),
        provideLayout({
          regions: [
            { id: 'primary', type: 'panel', dock: 'left' },
            { id: 'main', type: 'content', dock: 'center' },
            { id: 'left-footer', type: 'bar', dock: 'left' },
          ],
        }),
      ],
    }).compileComponents();

    const registry = TestBed.inject(ContributionRegistry);
    registry.addBarItem({
      id: 'foot.help',
      bar: 'left-footer',
      slot: 'end',
      icon: 'info',
      tooltip: 'help.about',
      run: () => undefined,
    });

    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();
    fixture.detectChanges();

    const labels = [...fixture.nativeElement.querySelectorAll('button')].map(
      (b) => (b as HTMLButtonElement).getAttribute('aria-label'),
    );
    expect(labels).toContain('help.about');
  });
});

describe('Shell with a collapsed sidebar', () => {
  beforeEach(() => localStorage.clear());

  async function renderCollapsed() {
    await TestBed.configureTestingModule({
      imports: [Shell, translocoTesting()],
      providers: [
        provideRouter([]),
        provideLayout({
          regions: [
            { id: 'primary', type: 'panel', dock: 'left' },
            { id: 'main', type: 'content', dock: 'center' },
          ],
        }),
      ],
    }).compileComponents();
    TestBed.inject(SidebarService).collapse('primary');
    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();
    const banner = () => {
      fixture.detectChanges();
      return (fixture.nativeElement as HTMLElement).querySelector(
        '[role="banner"]',
      );
    };
    return { banner };
  }

  it('draws the row holding the control to expand it', async () => {
    const { banner } = await renderCollapsed();

    expect(banner()?.querySelector('button')).not.toBeNull();
  });

  it('draws no empty banner once collapsing is switched off', async () => {
    const { banner } = await renderCollapsed();

    TestBed.inject(FeatureSwitches).update({ sidebar: { collapse: false } });

    expect(banner()).toBeNull();
    expect(TestBed.inject(SidebarService).isCollapsed('primary')).toBe(true);
  });
});

@Component({ selector: 'lw-test-drawer-view', template: '<button>inside</button>' })
class DrawerView {}

@Component({
  selector: 'lw-test-frame-view',
  template: '<iframe title="frame"></iframe>',
})
class FrameView {}

function refuseFocusAsBehindTheDrawer(element: HTMLElement | null): void {
  if (element?.closest('[inert]')) {
    element.focus = () => undefined;
  }
}

function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('Shell compact drawer', () => {
  beforeEach(() => localStorage.clear());

  async function openDrawer(view: Type<unknown> = DrawerView) {
    const compact = signal(true);
    await TestBed.configureTestingModule({
      imports: [Shell, translocoTesting()],
      providers: [
        provideRouter([]),
        { provide: ViewportService, useValue: { compact } },
        provideLayout({
          regions: [
            { id: 'primary', type: 'panel', dock: 'left' },
            { id: 'main', type: 'content', dock: 'center' },
            { id: 'status', type: 'bar', dock: 'bottom' },
          ],
        }),
      ],
    }).compileComponents();
    TestBed.inject(ContributionRegistry).addView({
      id: 'nav',
      region: 'primary',
      title: 'nav',
      icon: 'navigator',
      order: 0,
      component: view,
    });
    TestBed.inject(PanelGroupService).seed('primary');
    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const opener = root.querySelector<HTMLElement>('[aria-label="panel.open"]');
    opener?.focus();
    opener?.click();
    await fixture.whenStable();
    const drawer = root.querySelector<HTMLElement>(
      'aside[aria-label="landmark.leftPanel"]',
    );
    return { fixture, root, opener, drawer, compact };
  }

  function press(key: string, shiftKey = false): KeyboardEvent {
    const event = new KeyboardEvent('keydown', {
      key,
      shiftKey,
      bubbles: true,
      cancelable: true,
    });
    (document.activeElement ?? document.body).dispatchEvent(event);
    return event;
  }

  it('takes the focus when it opens', async () => {
    const { drawer } = await openDrawer();

    expect(drawer?.contains(document.activeElement)).toBe(true);
  });

  it('leaves the focus with a menu that is open while it opens, and holds it once the menu has closed', async () => {
    const { fixture, opener, drawer } = await openDrawer();
    TestBed.inject(PanelState).closeOverlay();
    await fixture.whenStable();
    const menus = TestBed.inject(MenuService);
    opener?.focus();
    menus.openList(
      [{ key: 'one', label: 'One' }],
      { x: 0, y: 0 },
      () => undefined,
      opener ?? undefined,
    );
    await settle();
    const menu = document.body.querySelector<HTMLElement>(LW_MENU_TAG);
    expect(menu?.contains(document.activeElement)).toBe(true);

    TestBed.inject(PanelState).openOverlay('primary');
    await fixture.whenStable();
    expect(menu?.contains(document.activeElement)).toBe(true);

    refuseFocusAsBehindTheDrawer(opener);
    menus.close();

    expect(drawer?.contains(document.activeElement)).toBe(true);
  });

  it('makes what is behind it inert and lifts that when it closes', async () => {
    const { fixture, root } = await openDrawer();
    const behind = () =>
      ['lw-shell-edge', 'main', 'footer'].map((selector) =>
        root.querySelector(selector)?.closest('[inert]') !== null,
      );

    expect(behind()).toEqual([true, true, true]);

    TestBed.inject(PanelState).closeOverlay();
    await fixture.whenStable();

    expect(behind()).toEqual([false, false, false]);
  });

  it('leaves nothing inert once the window is wide again, although the drawer was never closed', async () => {
    const { fixture, root, compact } = await openDrawer();

    compact.set(false);
    await fixture.whenStable();

    expect(root.querySelector('[inert]')).toBeNull();
  });

  it('leaves Tab past its last control to the browser, so the keyboard reaches a view drawn in a frame', async () => {
    const { drawer } = await openDrawer(FrameView);
    const controls = [
      ...(drawer?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [tabindex]:not([tabindex="-1"])',
      ) ?? []),
    ];
    expect(drawer?.querySelector('iframe')).not.toBeNull();
    expect(controls.length).toBeGreaterThan(1);

    controls.at(-1)?.focus();
    expect(press('Tab').defaultPrevented).toBe(false);

    controls[0]?.focus();
    expect(press('Tab', true).defaultPrevented).toBe(false);
  });

  it('keeps the focus when it moves into the frame of a view', async () => {
    const { drawer } = await openDrawer(FrameView);
    const frame = drawer?.querySelector('iframe');

    frame?.focus();

    expect(document.activeElement).toBe(frame);
  });

  it('gives the focus to the sidebar when the window becomes wide and the control that opened it is gone', async () => {
    const { fixture, root, opener, compact } = await openDrawer();

    compact.set(false);
    await fixture.whenStable();

    expect(opener?.isConnected).toBe(false);
    expect(
      root
        .querySelector('lw-shell-edge #panel-views-primary')
        ?.contains(document.activeElement),
    ).toBe(true);
  });

  it('gives the focus back to the control that opened it when the window becomes wide and that control is still there', async () => {
    const { fixture, compact } = await openDrawer();
    TestBed.inject(PanelState).closeOverlay();
    await fixture.whenStable();
    const outside = document.createElement('button');
    document.body.append(outside);
    outside.focus();
    TestBed.inject(PanelState).openOverlay('primary');
    await fixture.whenStable();
    expect(document.activeElement).not.toBe(outside);

    compact.set(false);
    await fixture.whenStable();
    const held = document.activeElement;
    outside.remove();

    expect(held).toBe(outside);
  });

  it('takes the focus back from anything behind it', async () => {
    const { opener, drawer } = await openDrawer();

    opener?.focus();

    expect(drawer?.contains(document.activeElement)).toBe(true);
  });

  it('closes on Escape and gives the focus back to the control that opened it', async () => {
    const { fixture, opener } = await openDrawer();

    expect(press('Escape').defaultPrevented).toBe(true);
    await fixture.whenStable();

    expect(TestBed.inject(PanelState).anyOverlayOpen()).toBe(false);
    expect(document.activeElement).toBe(opener);
  });

  it('gives the focus back when its own close control closes it', async () => {
    const { fixture, opener, drawer } = await openDrawer();

    drawer?.querySelector<HTMLElement>('[aria-label="panel.close"]')?.click();
    await fixture.whenStable();

    expect(document.activeElement).toBe(opener);
  });

  it('leaves Escape and the focus to a dialog opened above it', async () => {
    const { fixture, drawer } = await openDrawer();
    void TestBed.inject(DialogService).confirm({ message: 'sure' });
    await fixture.whenStable();

    press('Escape');
    await fixture.whenStable();

    expect(TestBed.inject(PanelState).anyOverlayOpen()).toBe(true);
    expect(drawer?.contains(document.activeElement)).toBe(true);
  });
});

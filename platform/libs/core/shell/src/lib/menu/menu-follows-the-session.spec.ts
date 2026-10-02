import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ANONYMOUS, AuthSnapshot } from '@loomweaver/plugin-sdk';
import { AUTH_SOURCE } from '../auth/auth-context';
import { ContributionRegistry } from '../contributions/contribution-registry';
import {
  defineLwMenu,
  LW_MENU_ITEM_TAG,
  LW_MENU_TAG,
} from '../elements/menu/lw-menu.element';
import { PopoutWindow } from '../popout/popout-window';
import { MenuService } from './menu.service';

defineLwMenu();

function transloco() {
  return TranslocoTestingModule.forRoot({
    langs: { en: { open: 'Open', share: 'Share', profile: 'Profile' } },
    translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
    preloadLangs: true,
  });
}

describe('a menu follows who is looking at it', () => {
  const session = signal<AuthSnapshot>(ANONYMOUS);
  const signedIn: AuthSnapshot = { authenticated: true, roles: [], claims: {} };
  let service: MenuService;
  let registry: ContributionRegistry;

  function setup(popout = false) {
    session.set(ANONYMOUS);
    TestBed.configureTestingModule({
      imports: [transloco()],
      providers: [
        { provide: AUTH_SOURCE, useValue: session },
        { provide: PopoutWindow, useValue: { active: popout } },
      ],
    });
    service = TestBed.inject(MenuService);
    registry = TestBed.inject(ContributionRegistry);
    document.body.replaceChildren();
    registry.addCommand({ id: 'c.open', title: 'open', run: () => undefined });
    registry.addCommand({
      id: 'c.share',
      title: 'share',
      access: { authenticated: true },
      run: () => undefined,
    });
  }

  afterEach(() => service.close());

  function offered(): string[] {
    return [
      ...(document.body
        .querySelector(LW_MENU_TAG)
        ?.querySelectorAll(LW_MENU_ITEM_TAG) ?? []),
    ].map((entry) => entry.getAttribute('command') ?? '');
  }

  function open(header?: { title: string; command?: string }) {
    service.open('m', {}, { x: 0, y: 0 }, { header });
  }

  it('leaves out an entry whose command the session may not run, and draws it once it may', () => {
    setup();
    registry.addMenuItem({ menu: 'm', command: 'c.open' });
    registry.addMenuItem({ menu: 'm', command: 'c.share' });

    open();
    expect(offered()).toEqual(['c.open']);

    session.set(signedIn);
    open();
    expect(offered()).toEqual(['c.open', 'c.share']);
  });

  it('does not open a slot whose every entry is refused', () => {
    setup();
    registry.addMenuItem({ menu: 'm', command: 'c.share' });

    open();

    expect(document.body.querySelector(LW_MENU_TAG)).toBeNull();
  });

  it('keeps an entry that carries behaviour of its own', () => {
    setup();
    registry.addMenuItem({ menu: 'm', title: 'profile', run: () => undefined });

    open();

    expect(document.body.querySelector(LW_MENU_TAG)).not.toBeNull();
  });

  it('leaves a heading that leads to a refused command a plain heading', () => {
    setup();
    registry.addMenuItem({ menu: 'm', command: 'c.open' });

    open({ title: 'profile', command: 'c.share' });
    const heading = document.body.querySelector('.lw-menu-header');
    expect(heading).not.toBeNull();
    expect(heading?.getAttribute('role')).not.toBe('menuitem');

    session.set(signedIn);
    open({ title: 'profile', command: 'c.share' });
    expect(
      document.body.querySelector('.lw-menu-header')?.getAttribute('role'),
    ).toBe('menuitem');
  });

  it('offers in a detached window only the commands that belong there', () => {
    setup(true);
    registry.addCommand({
      id: 'c.zoom',
      title: 'open',
      popout: true,
      run: () => undefined,
    });
    registry.addMenuItem({ menu: 'm', command: 'c.open' });
    registry.addMenuItem({ menu: 'm', command: 'c.zoom' });

    open();

    expect(offered()).toEqual(['c.zoom']);
  });
});

import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  provideTransloco,
  Translation,
  TranslocoLoader,
  TranslocoService,
} from '@jsverse/transloco';
import { Observable, Subject } from 'rxjs';
import { MenuContext } from '@loomweaver/plugin-sdk';
import { MenuService } from './menu.service';
import { ContributionRegistry } from '../plugin/contribution-registry';
import {
  defineLwMenu,
  LW_MENU_ITEM_TAG,
  LW_MENU_TAG,
} from '../elements/menu/lw-menu.element';

defineLwMenu();

const BUNDLES: Record<string, Translation> = {
  en: {
    cmd: { profile: 'Profile', signOut: 'Sign out' },
    account: { title: 'Your account' },
  },
  de: {
    cmd: { profile: 'Profil', signOut: 'Abmelden' },
    account: { title: 'Ihr Konto' },
  },
};

@Injectable()
class HeldLoader implements TranslocoLoader {
  static readonly held = new Map<string, Subject<Translation>>();

  static arrive(lang: string): void {
    const pending = this.held.get(lang);
    pending?.next(BUNDLES[lang]);
    pending?.complete();
  }

  getTranslation(lang: string): Observable<Translation> {
    const pending = new Subject<Translation>();
    HeldLoader.held.set(lang, pending);
    return pending;
  }
}

const context: MenuContext = { targetKind: 'account' };

describe('an open menu follows its strings', () => {
  let service: MenuService;
  let transloco: TranslocoService;

  beforeEach(() => {
    HeldLoader.held.clear();
    TestBed.configureTestingModule({
      providers: [
        provideTransloco({
          config: {
            availableLangs: ['en', 'de'],
            defaultLang: 'en',
            missingHandler: { logMissingKey: false },
          },
          loader: HeldLoader,
        }),
      ],
    });
    service = TestBed.inject(MenuService);
    transloco = TestBed.inject(TranslocoService);
    const registry = TestBed.inject(ContributionRegistry);
    registry.addCommand({
      id: 'c.profile',
      title: 'cmd.profile',
      run: () => undefined,
    });
    registry.addCommand({
      id: 'c.signOut',
      title: 'cmd.signOut',
      run: () => undefined,
    });
    registry.addMenuItem({ menu: 'account', command: 'c.profile' });
    registry.addMenuItem({ menu: 'account', command: 'c.signOut' });
    document.body.replaceChildren();
  });

  afterEach(() => service.close());

  function labels(): (string | null)[] {
    return [
      ...(document.body
        .querySelector(LW_MENU_TAG)
        ?.querySelectorAll(LW_MENU_ITEM_TAG) ?? []),
    ].map((item) => item.getAttribute('label'));
  }

  function headingTitle(): string | null | undefined {
    return document.body.querySelector('.lw-menu-header-title')?.textContent;
  }

  async function loaded(lang: string): Promise<void> {
    const load = transloco.load(lang).toPromise();
    HeldLoader.arrive(lang);
    await load;
  }

  it('words a menu opened before its strings once they arrive, heading included', () => {
    const loading = transloco.load('en').subscribe();
    service.open(
      'account',
      context,
      { x: 0, y: 0 },
      { header: { title: 'account.title' } },
    );

    expect(labels()).toEqual(['cmd.profile', 'cmd.signOut']);
    expect(headingTitle()).toBe('account.title');

    HeldLoader.arrive('en');

    expect(labels()).toEqual(['Profile', 'Sign out']);
    expect(headingTitle()).toBe('Your account');
    expect(
      document.body.querySelector(LW_MENU_TAG)?.getAttribute('aria-label'),
    ).toBe('Your account');
    loading.unsubscribe();
  });

  it('re-words an open menu in a language chosen while it is open, keeping the focus', async () => {
    await loaded('en');
    await loaded('de');
    service.open('account', context, { x: 0, y: 0 });
    const second = document.body.querySelectorAll(LW_MENU_ITEM_TAG)[1] as
      HTMLElement | undefined;
    second?.focus();

    transloco.setActiveLang('de');

    expect(labels()).toEqual(['Profil', 'Abmelden']);
    expect(document.activeElement).toBe(second);
  });

  it('translates an ad-hoc entry given a key, and shows a literal or a composed label as it is', async () => {
    await loaded('en');
    await loaded('de');
    service.openList(
      [
        { key: 'a', label: 'cmd.profile' },
        { key: 'b', label: 'Ada Lovelace' },
        { key: 'c', label: () => 'notes.v2' },
      ],
      { x: 0, y: 0 },
      () => undefined,
    );

    expect(labels()).toEqual(['Profile', 'Ada Lovelace', 'notes.v2']);

    transloco.setActiveLang('de');

    expect(labels()).toEqual(['Profil', 'Ada Lovelace', 'notes.v2']);
  });

  it('stops following the strings once the menu is closed', async () => {
    await loaded('en');
    await loaded('de');
    service.open('account', context, { x: 0, y: 0 });
    const item = document.body.querySelector(LW_MENU_ITEM_TAG);
    service.close();

    transloco.setActiveLang('de');

    expect(item?.getAttribute('label')).toBe('Profile');
  });
});

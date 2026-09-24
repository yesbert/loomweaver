import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  provideTransloco,
  Translation,
  TranslocoLoader,
  TranslocoService,
} from '@jsverse/transloco';
import { firstValueFrom, Observable, Subject } from 'rxjs';
import { MenuContext } from '@loomweaver/plugin-sdk';
import { MenuService } from './menu.service';
import { ContributionRegistry } from '../contributions/contribution-registry';
import {
  defineLwMenu,
  LW_MENU_ITEM_TAG,
  LW_MENU_TAG,
  LwMenuElement,
} from '../elements/menu/lw-menu.element';

defineLwMenu();

const BUNDLES: Record<string, Translation> = {
  en: {
    cmd: { profile: 'Profile', signOut: 'Sign out' },
    account: { title: 'Your account' },
  },
  de: {
    cmd: { profile: 'Profil', signOut: 'Vom Konto abmelden' },
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

const PIXELS_PER_CHARACTER = 10;

function sizedByItsLongestLabel(this: HTMLElement): DOMRect {
  const longest = Math.max(
    ...[...this.querySelectorAll(LW_MENU_ITEM_TAG)].map(
      (item) => (item.getAttribute('label') ?? '').length,
    ),
  );
  const width = longest * PIXELS_PER_CHARACTER;
  return { width, height: 40, left: 0, top: 0, right: width, bottom: 40 } as DOMRect;
}

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

  afterEach(() => {
    service.close();
    vi.restoreAllMocks();
  });

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
    const load = firstValueFrom(transloco.load(lang));
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

    expect(labels()).toEqual(['Profil', 'Vom Konto abmelden']);
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

  it('places a menu again when its words make it wider, so it stays in the window', async () => {
    await loaded('en');
    await loaded('de');
    vi.spyOn(LwMenuElement.prototype, 'getBoundingClientRect').mockImplementation(
      sizedByItsLongestLabel,
    );
    const nearTheRightEdge = window.innerWidth - 100;
    service.open('account', context, { x: nearTheRightEdge, y: 0 });
    const menu = document.body.querySelector<HTMLElement>(LW_MENU_TAG);
    expect(menu?.style.left).toBe(`${nearTheRightEdge}px`);

    transloco.setActiveLang('de');
    TestBed.tick();

    const width = 'Vom Konto abmelden'.length * PIXELS_PER_CHARACTER;
    expect(Number.parseFloat(menu?.style.left ?? '')).toBeLessThanOrEqual(
      window.innerWidth - width,
    );
  });

  it('places a menu opened from a control beside that control again, where the control now is', async () => {
    await loaded('en');
    await loaded('de');
    vi.spyOn(LwMenuElement.prototype, 'getBoundingClientRect').mockImplementation(
      sizedByItsLongestLabel,
    );
    const control = document.createElement('button');
    document.body.append(control);
    const at = (left: number) =>
      ({ left, top: 0, right: left + 32, bottom: 32, width: 32, height: 32 }) as DOMRect;
    vi.spyOn(control, 'getBoundingClientRect').mockReturnValue(at(100));
    service.open(
      'account',
      context,
      { rect: at(100), side: 'bottom' },
      { trigger: control },
    );
    const menu = document.body.querySelector<HTMLElement>(LW_MENU_TAG);
    expect(menu?.style.left).toBe('100px');

    vi.spyOn(control, 'getBoundingClientRect').mockReturnValue(at(160));
    transloco.setActiveLang('de');
    TestBed.tick();

    expect(menu?.style.left).toBe('160px');
  });

  it('moves a menu opened at a point below a control with that control', async () => {
    await loaded('en');
    await loaded('de');
    const control = document.createElement('button');
    document.body.append(control);
    const rect = (left: number) =>
      ({ left, top: 0, right: left + 32, bottom: 32, width: 32, height: 32 }) as DOMRect;
    vi.spyOn(control, 'getBoundingClientRect').mockReturnValue(rect(100));
    service.openList(
      [{ key: 'a', label: 'cmd.profile' }],
      { x: 100, y: 36 },
      () => undefined,
      control,
    );
    const menu = document.body.querySelector<HTMLElement>(LW_MENU_TAG);

    vi.spyOn(control, 'getBoundingClientRect').mockReturnValue(rect(160));
    transloco.setActiveLang('de');
    TestBed.tick();

    expect(menu?.style.left).toBe('160px');
    expect(menu?.style.top).toBe('36px');
  });

  it('leaves a menu where it last stood when the control it was opened from is gone', async () => {
    await loaded('en');
    await loaded('de');
    const control = document.createElement('button');
    document.body.append(control);
    const rect = (left: number) =>
      ({ left, top: 0, right: left + 32, bottom: 32, width: 32, height: 32 }) as DOMRect;
    const measured = vi
      .spyOn(control, 'getBoundingClientRect')
      .mockReturnValue(rect(100));
    service.openList(
      [{ key: 'a', label: 'cmd.profile' }],
      { x: 100, y: 36 },
      () => undefined,
      control,
    );
    const menu = document.body.querySelector<HTMLElement>(LW_MENU_TAG);
    measured.mockReturnValue(rect(160));
    transloco.setActiveLang('de');
    TestBed.tick();
    expect(menu?.style.left).toBe('160px');

    control.remove();
    measured.mockReturnValue(new DOMRect(0, 0, 0, 0));
    transloco.setActiveLang('en');
    TestBed.tick();

    expect(menu?.style.left).toBe('160px');
    expect(menu?.style.top).toBe('36px');
  });

  it('keeps a menu whose control is gone within the window when its words grow', async () => {
    await loaded('en');
    await loaded('de');
    vi.spyOn(LwMenuElement.prototype, 'getBoundingClientRect').mockImplementation(
      sizedByItsLongestLabel,
    );
    const control = document.createElement('button');
    document.body.append(control);
    const nearTheRightEdge = window.innerWidth - 100;
    service.open(
      'account',
      context,
      { x: nearTheRightEdge, y: 0 },
      { trigger: control },
    );
    const menu = document.body.querySelector<HTMLElement>(LW_MENU_TAG);

    control.remove();
    transloco.setActiveLang('de');
    TestBed.tick();

    const width = 'Vom Konto abmelden'.length * PIXELS_PER_CHARACTER;
    expect(Number.parseFloat(menu?.style.left ?? '')).toBeLessThanOrEqual(
      window.innerWidth - width,
    );
  });

  it('leaves a menu where it is when the control it was opened from is hidden', async () => {
    await loaded('en');
    await loaded('de');
    const control = document.createElement('button');
    document.body.append(control);
    const measured = vi
      .spyOn(control, 'getBoundingClientRect')
      .mockReturnValue(
        { left: 100, top: 0, right: 132, bottom: 32, width: 32, height: 32 } as DOMRect,
      );
    service.openList(
      [{ key: 'a', label: 'cmd.profile' }],
      { x: 100, y: 36 },
      () => undefined,
      control,
    );
    const menu = document.body.querySelector<HTMLElement>(LW_MENU_TAG);

    measured.mockReturnValue(new DOMRect(0, 0, 0, 0));
    transloco.setActiveLang('de');
    TestBed.tick();

    expect(menu?.style.left).toBe('100px');
  });

  it('moves a menu whose words did not change with the control it was opened from', async () => {
    await loaded('en');
    await loaded('de');
    const control = document.createElement('button');
    document.body.append(control);
    const rect = (left: number) =>
      ({ left, top: 0, right: left + 32, bottom: 32, width: 32, height: 32 }) as DOMRect;
    const measured = vi
      .spyOn(control, 'getBoundingClientRect')
      .mockReturnValue(rect(100));
    service.openList(
      [{ key: 'a', label: () => 'Ada Lovelace' }],
      { x: 100, y: 36 },
      () => undefined,
      control,
    );
    const menu = document.body.querySelector<HTMLElement>(LW_MENU_TAG);

    measured.mockReturnValue(rect(160));
    transloco.setActiveLang('de');
    TestBed.tick();

    expect(menu?.style.left).toBe('160px');
  });

  it('keeps a menu beside the side of a control that grew with its words', async () => {
    await loaded('en');
    await loaded('de');
    const control = document.createElement('button');
    document.body.append(control);
    const measured = vi
      .spyOn(control, 'getBoundingClientRect')
      .mockReturnValue(
        { left: 0, top: 100, right: 40, bottom: 136, width: 40, height: 36 } as DOMRect,
      );
    service.open(
      'account',
      context,
      { rect: { left: 0, top: 100, right: 40, bottom: 136 }, side: 'right' },
      { trigger: control },
    );
    const menu = document.body.querySelector<HTMLElement>(LW_MENU_TAG);
    expect(menu?.style.left).toBe('44px');

    measured.mockReturnValue(
      { left: 0, top: 100, right: 80, bottom: 136, width: 80, height: 36 } as DOMRect,
    );
    transloco.setActiveLang('de');
    TestBed.tick();

    expect(menu?.style.left).toBe('84px');
  });

  it('shows an entry named like a member of every object as it is', async () => {
    await loaded('en');
    service.openList(
      [
        { key: 'a', label: 'constructor' },
        { key: 'b', label: 'toString' },
      ],
      { x: 0, y: 0 },
      () => undefined,
    );

    expect(labels()).toEqual(['constructor', 'toString']);
  });

  it('shows an entry whose label is not a string instead of failing to open', async () => {
    await loaded('en');
    service.openList(
      [{ key: 'a', label: 42 as unknown as string }],
      { x: 0, y: 0 },
      () => undefined,
    );

    expect(labels()).toEqual(['42']);
  });

  it('keeps a menu opened at the right edge of a control at that edge when the control grows', async () => {
    await loaded('en');
    await loaded('de');
    const control = document.createElement('button');
    document.body.append(control);
    const measured = vi
      .spyOn(control, 'getBoundingClientRect')
      .mockReturnValue(
        { left: 100, top: 0, right: 132, bottom: 32, width: 32, height: 32 } as DOMRect,
      );
    service.openList(
      [{ key: 'a', label: 'cmd.profile' }],
      { x: 132, y: 36 },
      () => undefined,
      control,
    );
    const menu = document.body.querySelector<HTMLElement>(LW_MENU_TAG);

    measured.mockReturnValue(
      { left: 100, top: 0, right: 172, bottom: 32, width: 72, height: 32 } as DOMRect,
    );
    transloco.setActiveLang('de');
    TestBed.tick();

    expect(menu?.style.left).toBe('172px');
  });

  it('does not move an open menu when a bundle of another language arrives', async () => {
    await loaded('en');
    const control = document.createElement('button');
    document.body.append(control);
    const measured = vi
      .spyOn(control, 'getBoundingClientRect')
      .mockReturnValue(
        { left: 100, top: 0, right: 132, bottom: 32, width: 32, height: 32 } as DOMRect,
      );
    service.openList(
      [{ key: 'a', label: 'cmd.profile' }],
      { x: 100, y: 36 },
      () => undefined,
      control,
    );
    const menu = document.body.querySelector<HTMLElement>(LW_MENU_TAG);

    measured.mockReturnValue(
      { left: 160, top: 0, right: 192, bottom: 32, width: 32, height: 32 } as DOMRect,
    );
    await loaded('de');
    TestBed.tick();

    expect(menu?.style.left).toBe('100px');
  });

  it('keeps its words, not keys, while a language chosen meanwhile is still loading', async () => {
    await loaded('en');
    service.open('account', context, { x: 0, y: 0 });

    transloco.setActiveLang('de');
    expect(labels()).toEqual(['Profile', 'Sign out']);

    const loading = transloco.load('de').subscribe();
    HeldLoader.arrive('de');
    loading.unsubscribe();

    expect(labels()).toEqual(['Profil', 'Vom Konto abmelden']);
  });
});

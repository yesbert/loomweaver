import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ANONYMOUS,
  AuthSnapshot,
  CapabilityError,
} from '@loomweaver/plugin-sdk';
import { TranslocoService } from '@jsverse/transloco';
import {
  defineLwMenu,
  LW_MENU_ITEM_TAG,
} from '../../elements/menu/lw-menu.element';
import { ALL, REGIONS, makeContext } from './host-context-harness';

describe('the ui, host and session a plugin is handed', () => {
  it('exposes the host ui facade (toast + openSettings) through ctx.ui', () => {
    const { ctx, dialogs, notifications } = makeContext();

    ctx.ui.toast({ message: 'hi' });
    ctx.ui.openSettings();

    expect(notifications.notifications()).toHaveLength(1);
    expect(dialogs.dialogs()).toHaveLength(1);
  });

  it('namespaces a plugin-supplied toast id with the plugin id (no host/cross-plugin id collision)', () => {
    const { ctx, notifications } = makeContext();

    ctx.ui.toast({ id: 'update', message: 'hi' });

    expect(notifications.notifications()[0].id).toBe('test-plugin.update');
  });

  it('ctx.ui.openMenu opens an ad-hoc menu and dispatches the picked item run (in-process)', () => {
    const { ctx, menu } = makeContext();
    const open = vi.fn();
    const remove = vi.fn();
    const openList = vi
      .spyOn(menu, 'openList')
      .mockImplementation((_entries, _at, _pick) => undefined);

    ctx.ui.openMenu(
      [
        { label: 'Open', icon: 'search', run: open },
        { label: 'Remove', run: remove },
      ],
      { x: 10, y: 20 },
    );

    expect(openList).toHaveBeenCalledTimes(1);
    const [entries, at, onPick] = openList.mock.calls[0];
    expect(at).toEqual({ x: 10, y: 20 });
    expect(entries).toEqual([
      { key: '0', label: 'Open', icon: 'search' },
      { key: '1', label: 'Remove', icon: undefined },
    ]);

    onPick('1');
    expect(remove).toHaveBeenCalledTimes(1);
    expect(open).not.toHaveBeenCalled();
  });

  it('ctx.ui.openMenu translates an entry given a key and re-words it on a language change, and shows a literal as it is', () => {
    defineLwMenu();
    const { ctx, menu } = makeContext(ALL, REGIONS, signal(ANONYMOUS), 'drawn');
    const labels = () =>
      [...document.body.querySelectorAll(LW_MENU_ITEM_TAG)].map((item) =>
        item.getAttribute('label'),
      );

    onTestFinished(() => menu.close());
    ctx.ui.openMenu(
      [
        { label: 'test-plugin.menu.open', run: () => undefined },
        { label: 'Ada Lovelace', run: () => undefined },
      ],
      { x: 0, y: 0 },
    );
    expect(labels()).toEqual(['Open', 'Ada Lovelace']);

    TestBed.inject(TranslocoService).setActiveLang('de');
    expect(labels()).toEqual(['Öffnen', 'Ada Lovelace']);
  });

  it('ctx.ui.openMenu requires the "ui" capability (default-deny)', () => {
    const { ctx } = makeContext(['contributions']);
    expect(() =>
      ctx.ui.openMenu([{ label: 'x', run: () => undefined }], { x: 0, y: 0 }),
    ).toThrow(CapabilityError);
  });

  it('exposes read-only host facts (version + update) through ctx.host', () => {
    const { ctx, version, update } = makeContext();

    expect(ctx.host.version()).toBe(version.version());
    expect(ctx.host.updateAvailable()).toBe(update.updateAvailable());
    expect(ctx.host.updatesEnabled).toBe(update.enabled);
    expect(typeof ctx.host.checkForUpdate).toBe('function');
    expect(typeof ctx.host.activateUpdate).toBe('function');
  });

  it('exposes reactive session facts (login state + roles) through ctx.session', () => {
    const auth = signal<AuthSnapshot>(ANONYMOUS);
    const { ctx } = makeContext(ALL, REGIONS, auth);

    expect(ctx.session.authenticated()).toBe(false);
    expect(ctx.session.roles()).toEqual([]);
    expect(ctx.session.hasRole('admin')).toBe(false);

    auth.set({ authenticated: true, roles: ['admin'], claims: {} });
    expect(ctx.session.authenticated()).toBe(true);
    expect(ctx.session.roles()).toEqual(['admin']);
    expect(ctx.session.hasRole('admin')).toBe(true);
  });

  it('rejects ctx.session access without the "session" capability', () => {
    const { ctx } = makeContext(['contributions', 'ui']);
    expect(() => ctx.session).toThrow(CapabilityError);
  });
});

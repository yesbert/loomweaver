import { Injector, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ANONYMOUS, AuthSnapshot } from '@loomweaver/plugin-sdk';
import { AUTH_SOURCE } from '../../../auth/auth-context';
import { ContributionRegistry } from '../../../contributions/contribution-registry';
import { ToolbarRegistry } from '../../../contributions/toolbar-registry';
import type { LwSlotView } from '../../../surface-kit/surface-kit.frame';
import { ToolbarSlots } from '../../toolbar/toolbar-slots.service';
import { SlotBridge } from './slot-bridge';

function transloco() {
  return TranslocoTestingModule.forRoot({
    langs: {
      en: { bar: { more: 'More' }, acme: { tools: 'Frame tools', share: 'Share', sources: 'Sources' } },
      de: { bar: { more: 'Mehr' }, acme: { tools: 'Werkzeuge', share: 'Teilen', sources: 'Quellen' } },
    },
    translocoConfig: { availableLangs: ['en', 'de'], defaultLang: 'en' },
    preloadLangs: true,
  });
}

describe('SlotBridge', () => {
  const SLOT = 'acme.frame/toolbar';
  const session = signal<AuthSnapshot>(ANONYMOUS);
  let registry: ContributionRegistry;
  let pushes: [string, LwSlotView][];
  let bridge: SlotBridge;
  let ran: unknown[];

  beforeEach(() => {
    session.set(ANONYMOUS);
    pushes = [];
    ran = [];
    TestBed.configureTestingModule({
      imports: [transloco()],
      providers: [{ provide: AUTH_SOURCE, useValue: session }],
    });
    registry = TestBed.inject(ContributionRegistry);
    TestBed.inject(ToolbarRegistry).addToolbar({ slot: SLOT, title: 'acme.tools' }, 'acme');
    registry.addCommand({
      id: 'acme.share',
      title: 'acme.share',
      icon: 'share',
      run: (context) => {
        ran.push(context);
      },
    });
    bridge = new SlotBridge(
      TestBed.inject(ToolbarSlots),
      TestBed.inject(Injector),
      (subscription, view) => {
        pushes.push([subscription, view]);
      },
    );
  });

  async function settle(): Promise<void> {
    TestBed.tick();
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  it('answers a watched slot with worded, resolved entries and the names the toolbar needs', async () => {
    registry.addMenuItem({ menu: SLOT, command: 'acme.share' }, 'scanner');
    const id = bridge.watch(SLOT, { record: 'r1' });
    await settle();

    const [subscription, view] = pushes.at(-1) as [string, LwSlotView];
    expect(subscription).toBe(id);
    expect(view.label).toBe('Frame tools');
    expect(view.moreLabel).toBe('More');
    expect(view.entries).toEqual([
      expect.objectContaining({ key: `${SLOT}#acme.share`, label: 'Share', icon: 'share', opensMenu: false }),
    ]);
  });

  it('follows the session, the entries and the words, and stops once unwatched', async () => {
    registry.addCommand({
      id: 'acme.star',
      title: 'acme.share',
      access: { authenticated: true },
      run: () => undefined,
    });
    const entry = registry.addMenuItem({ menu: SLOT, command: 'acme.star' }, 'scanner');
    const id = bridge.watch(SLOT, {});
    await settle();
    expect((pushes.at(-1) as [string, LwSlotView])[1].entries).toEqual([]);

    session.set({ authenticated: true, roles: [], claims: {} });
    await settle();
    expect((pushes.at(-1) as [string, LwSlotView])[1].entries).toHaveLength(1);

    entry.dispose();
    await settle();
    expect((pushes.at(-1) as [string, LwSlotView])[1].entries).toEqual([]);

    const before = pushes.length;
    bridge.unwatch(id);
    registry.addMenuItem({ menu: SLOT, command: 'acme.share' }, 'scanner');
    await settle();
    expect(pushes.length).toBe(before);
  });

  it('runs an activated entry with the description it was watched against', async () => {
    registry.addMenuItem({ menu: SLOT, command: 'acme.share' }, 'scanner');
    const id = bridge.watch(SLOT, { record: 'r1' });
    await settle();

    bridge.activate(id, `${SLOT}#acme.share`);
    bridge.activate(id, 'nobody');
    bridge.activate('unknown', `${SLOT}#acme.share`);

    expect(ran).toEqual([{ record: 'r1', id: `${SLOT}#acme.share` }]);
  });

  it('tells the surface that an entry opens a menu, and never a cell', async () => {
    registry.addMenuItem({ menu: `${SLOT}/sources`, command: 'acme.share' }, 'scanner');
    registry.addMenuItem(
      { id: 'acme.sources', menu: SLOT, title: 'acme.sources', submenu: `${SLOT}/sources` },
      'acme',
    );
    TestBed.inject(ToolbarRegistry).addCell({
      id: 'scanner.cell',
      slot: SLOT,
      component: class {},
    });
    bridge.watch(SLOT, {});
    await settle();

    const view = (pushes.at(-1) as [string, LwSlotView])[1];
    expect(view.entries).toHaveLength(1);
    expect(view.entries[0]).toMatchObject({ key: 'acme.sources', opensMenu: true });
    expect(JSON.stringify(view)).not.toContain(`${SLOT}/sources`);
    expect(JSON.stringify(view)).not.toContain('scanner.cell');
  });

  describe('a menu an entry opens', () => {
    const MENU = `${SLOT}/sources`;

    beforeEach(() => {
      registry.addMenuItem(
        {
          id: 'acme.sources',
          menu: SLOT,
          title: 'acme.sources',
          submenu: MENU,
          menuHeader: { title: 'acme.sources', command: 'acme.share' },
        },
        'acme',
      );
    });

    async function openSources(): Promise<[string, LwSlotView]> {
      const toolbar = bridge.watch(SLOT, { record: 'r1' });
      await settle();
      const menu = bridge.open(toolbar, 'acme.sources') as string;
      await settle();
      return [menu, (pushes.findLast(([id]) => id === menu) as [string, LwSlotView])[1]];
    }

    it('is matched against the opening entry, as the page matches it, and holds no untitled entry', async () => {
      registry.addMenuItem(
        { id: 'scanner.forSources', menu: MENU, command: 'acme.share', when: { id: 'acme.sources' } },
        'scanner',
      );
      registry.addMenuItem(
        { id: 'scanner.forItself', menu: MENU, title: 'acme.tools', run: () => undefined, when: { id: 'scanner.forItself' } },
        'scanner',
      );
      registry.addMenuItem({ id: 'scanner.untitled', menu: MENU, run: () => undefined }, 'scanner');

      const [menu, view] = await openSources();
      expect(view.entries.map((entry) => entry.key)).toEqual(['acme.share']);

      bridge.activate(menu, 'acme.share');
      expect(ran).toEqual([{ record: 'r1', id: 'acme.sources' }]);
    });

    it('carries the heading worded, and the heading runs what it leads to', async () => {
      registry.addMenuItem({ menu: MENU, command: 'acme.share' }, 'scanner');

      const [menu, view] = await openSources();
      expect(view.header).toEqual(expect.objectContaining({ title: 'Sources', leadsTo: 'Share' }));

      bridge.activate(menu, '__heading');
      expect(ran).toEqual([{ record: 'r1', id: 'acme.sources' }]);
    });

    it('answers nothing for an entry that opens nothing, one never shown, or an unknown subscription', async () => {
      registry.addMenuItem({ menu: SLOT, command: 'acme.share' }, 'scanner');
      const toolbar = bridge.watch(SLOT, {});
      await settle();

      expect(bridge.open(toolbar, `${SLOT}#acme.share`)).toBeUndefined();
      expect(bridge.open(toolbar, 'nobody')).toBeUndefined();
      expect(bridge.open('unknown', 'acme.sources')).toBeUndefined();
    });
  });

  it('replays the last answer of every watched slot when asked', async () => {
    registry.addMenuItem({ menu: SLOT, command: 'acme.share' }, 'scanner');
    const id = bridge.watch(SLOT, {});
    await settle();
    const before = pushes.length;

    bridge.replay();

    expect(pushes.length).toBe(before + 1);
    expect(pushes.at(-1)?.[0]).toBe(id);
    bridge.stopAll();
  });
});

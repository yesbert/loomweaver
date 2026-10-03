import { Command, MenuContext, MenuItem } from '@loomweaver/plugin-sdk';
import {
  resolveSlot,
  SlotEntry,
  SlotSources,
  whenMatches,
} from './menu-resolution';

describe('whenMatches', () => {
  const context = { targetKind: 'content-tab', pinned: false, closable: true };

  it('matches when there is no when clause', () => {
    expect(whenMatches(undefined, context)).toBe(true);
  });

  it('matches when every when key equals the context', () => {
    expect(whenMatches({ closable: true }, context)).toBe(true);
    expect(whenMatches({ closable: true, pinned: false }, context)).toBe(true);
  });

  it('does not match when any when key differs', () => {
    expect(whenMatches({ pinned: true }, context)).toBe(false);
    expect(whenMatches({ closable: true, pinned: true }, context)).toBe(false);
  });

  it('does not match a key missing from the context', () => {
    expect(whenMatches({ group: 'editor' }, context)).toBe(false);
  });
});

describe('resolveSlot', () => {
  const context: MenuContext = { targetKind: 'content-tab', closable: true };
  const inContext = () => context;

  function sources(
    commands: Command[] = [],
    overrides: Partial<SlotSources> = {},
  ): SlotSources {
    return {
      commands,
      available: () => true,
      shortcutOf: (command) => (command?.shortcut ? 'Ctrl+W' : undefined),
      visible: () => true,
      disabled: () => false,
      ...overrides,
    };
  }

  function command(id: string, extra: Partial<Command> = {}): Command {
    return { id, title: `cmd.${id}`, run: () => undefined, ...extra };
  }

  it('filters by when and sorts by group then order', () => {
    const entries: MenuItem[] = [
      { menu: 'm', command: 'b', group: '2_second' },
      { menu: 'm', command: 'a', group: '1_first' },
      { menu: 'm', command: 'hidden', when: { closable: false } },
    ];
    const resolved = resolveSlot(
      entries,
      inContext,
      sources([command('a'), command('b'), command('hidden')]),
    );

    expect(resolved.map((entry) => entry.key)).toEqual(['a', 'b']);
  });

  it('drops an entry whose command nothing registers, and keeps a run-only one', () => {
    const entries: MenuItem[] = [
      { menu: 'm', command: 'close' },
      { menu: 'm', command: 'omitted' },
      { menu: 'm', title: 'menu.close', run: () => undefined },
    ];
    const resolved = resolveSlot(entries, inContext, sources([command('close')]));

    expect(resolved.map((entry) => entry.title)).toEqual([
      'cmd.close',
      'menu.close',
    ]);
  });

  it('drops an entry whose command the session may not run, wherever it comes from', () => {
    const entries: SlotEntry[] = [
      { id: 'rail.secret', title: 'rail.secret', command: 'secret' },
      { id: 'rail.open', title: 'rail.open', command: 'open' },
    ];
    const resolved = resolveSlot(
      entries,
      inContext,
      sources([command('secret'), command('open')], {
        available: (candidate) => candidate.id !== 'secret',
      }),
    );

    expect(resolved.map((entry) => entry.key)).toEqual(['open']);
  });

  it('drops an entry that leads nowhere: no command, no behaviour, no menu, no workspace', () => {
    const entries: SlotEntry[] = [
      { id: 'dead', title: 'dead' },
      { id: 'switch', title: 'switch', workspace: 'ws-1' },
      { id: 'opener', title: 'opener', menu: 'own', menuTrigger: 'primary' },
    ];
    const resolved = resolveSlot(
      entries,
      inContext,
      sources([], {
        menuOffered: (entry) => (entry.id === 'opener' ? 'own' : undefined),
      }),
    );

    expect(resolved.map((entry) => entry.key)).toEqual(['switch', 'opener']);
    expect(resolved[1].opensMenu).toBe('own');
  });

  it("applies the entry's own requirement before the command's: hidden is gone, disabled stays inert", () => {
    const entries: SlotEntry[] = [
      { id: 'hidden', command: 'open', access: { anyRole: ['admin'] } },
      {
        id: 'inert',
        command: 'open',
        access: { authenticated: true, mode: 'disable' },
      },
    ];
    const resolved = resolveSlot(
      entries,
      inContext,
      sources([command('open')], {
        visible: (access) => access?.mode === 'disable',
        disabled: (access) => access?.mode === 'disable',
      }),
    );

    expect(resolved.map((entry) => entry.item.id)).toEqual(['inert']);
    expect(resolved[0].disabled).toBe(true);
  });

  it('takes the title, icon and shortcut from the command, and the check from the context', () => {
    const [entry] = resolveSlot(
      [{ menu: 'm', command: 'pin', checkedWhen: { closable: true } } as MenuItem],
      inContext,
      sources([command('pin', { icon: 'pin', shortcut: 'mod+w' })]),
    );

    expect(entry).toMatchObject({
      title: 'cmd.pin',
      icon: 'pin',
      shortcut: 'Ctrl+W',
      checkbox: true,
      checked: true,
      disabled: false,
    });
    expect(entry.command?.id).toBe('pin');
  });

  it("prefers the entry's own icon and carries its pressed state, or derives it from the check", () => {
    const resolved = resolveSlot(
      [
        { id: 'own', command: 'pin', icon: 'star', pressed: true },
        { id: 'checked', command: 'pin', checkedWhen: { closable: true } },
        { id: 'plain', command: 'pin' },
      ] as SlotEntry[],
      inContext,
      sources([command('pin', { icon: 'pin' })]),
    );

    expect(resolved.map((entry) => [entry.icon, entry.pressed])).toEqual([
      ['star', true],
      ['pin', true],
      ['pin', undefined],
    ]);
  });

  it('resolves each entry against its own context', () => {
    const entries: SlotEntry[] = [
      { id: 'one', title: 'one', command: 'open', when: { id: 'one' } },
      { id: 'two', title: 'two', command: 'open', when: { id: 'other' } },
    ];
    const resolved = resolveSlot(
      entries,
      (entry) => ({ id: entry.id ?? '' }),
      sources([command('open')]),
    );

    expect(resolved.map((entry) => entry.item.id)).toEqual(['one']);
  });
});

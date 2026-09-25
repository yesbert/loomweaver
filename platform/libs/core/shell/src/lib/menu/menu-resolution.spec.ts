import { Command, MenuContext, MenuItem } from '@loomweaver/plugin-sdk';
import { MenuSources, resolveMenuItems, whenMatches } from './menu-resolution';

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

describe('resolveMenuItems', () => {
  const context: MenuContext = { targetKind: 'content-tab', closable: true };

  function sources(
    menuItems: MenuItem[],
    commands: Command[] = [],
  ): MenuSources {
    return {
      menuItems,
      commands,
      shortcutOf: (command) => (command?.shortcut ? 'Ctrl+W' : undefined),
    };
  }

  function command(id: string, extra: Partial<Command> = {}): Command {
    return { id, title: `cmd.${id}`, run: () => undefined, ...extra };
  }

  it('keeps the slots asked for, filters by when and sorts by group then order', () => {
    const resolved = resolveMenuItems(
      ['m'],
      context,
      sources(
        [
          { menu: 'm', command: 'b', group: '2_second' },
          { menu: 'm', command: 'a', group: '1_first' },
          { menu: 'm', command: 'hidden', when: { closable: false } },
          { menu: 'other', command: 'a' },
        ],
        [command('a'), command('b'), command('hidden')],
      ),
    );

    expect(resolved.map((item) => item.key)).toEqual(['a', 'b']);
  });

  it('drops an item whose command does not resolve, and a run-only item without a title', () => {
    const resolved = resolveMenuItems(
      ['m'],
      context,
      sources(
        [
          { menu: 'm', command: 'close' },
          { menu: 'm', command: 'omitted' },
          { menu: 'm', run: () => undefined },
          { menu: 'm', title: 'menu.close', run: () => undefined },
        ],
        [command('close')],
      ),
    );

    expect(resolved.map((item) => item.title)).toEqual([
      'cmd.close',
      'menu.close',
    ]);
  });

  it('takes the icon and the shortcut from the command, and the check from the context', () => {
    const [item] = resolveMenuItems(
      ['m'],
      context,
      sources(
        [{ menu: 'm', command: 'pin', checkedWhen: { closable: true } }],
        [command('pin', { icon: 'pin', shortcut: 'mod+w' })],
      ),
    );

    expect(item).toMatchObject({
      icon: 'pin',
      shortcut: 'Ctrl+W',
      checkbox: true,
      checked: true,
    });
  });
});

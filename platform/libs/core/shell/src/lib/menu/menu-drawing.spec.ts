import {
  defineLwMenu,
  LW_MENU_ITEM_TAG,
} from '../elements/menu/lw-menu.element';
import { drawMenu, MenuRow } from './menu-drawing';

defineLwMenu();

const translate = (key: string): string => `t:${key}`;

function row(key: string, extra: Partial<MenuRow> = {}): MenuRow {
  return {
    key,
    label: key,
    group: '',
    checkbox: false,
    checked: false,
    ...extra,
  };
}

function places(menu: HTMLElement): string[] {
  return ['lw-menu--checks', 'lw-menu--leading'].filter((name) =>
    menu.classList.contains(name),
  );
}

describe('the leading places a menu reserves', () => {
  it('reserves only the check place for a menu of checks without icons', () => {
    const { menu } = drawMenu(
      [
        row('a', { checkbox: true, checked: true }),
        row('b', { checkbox: true }),
      ],
      translate,
    );
    expect(places(menu)).toEqual(['lw-menu--checks']);
  });

  it('reserves only the icon place for a menu of icons without checks', () => {
    const { menu } = drawMenu([row('a', { icon: 'x' }), row('b')], translate);
    expect(places(menu)).toEqual(['lw-menu--leading']);
  });

  it('reserves both, and keeps the icon of a checked row', () => {
    const { menu } = drawMenu(
      [
        row('light', { icon: 'themeLight', checkbox: true }),
        row('dark', { icon: 'themeDark', checkbox: true, checked: true }),
      ],
      translate,
    );
    const items = menu.querySelectorAll(LW_MENU_ITEM_TAG);

    expect(places(menu)).toEqual(['lw-menu--checks', 'lw-menu--leading']);
    expect(items[1].getAttribute('icon')).toBe('themeDark');
    expect(items[1].hasAttribute('checked')).toBe(true);
  });

  it('reserves neither for a plain menu', () => {
    const { menu } = drawMenu([row('a'), row('b')], translate);
    expect(places(menu)).toEqual([]);
  });
});

describe('drawing a menu', () => {
  it("separates groups, writes each row's key and shortcut, and words the labels", () => {
    const { menu } = drawMenu(
      [
        row('a', { group: '1', shortcut: 'Ctrl+W' }),
        row('b', { group: '2', label: (words) => words('menu.b') }),
      ],
      translate,
    );
    const items = [...menu.querySelectorAll(LW_MENU_ITEM_TAG)];

    expect(menu.querySelectorAll('[role="separator"]')).toHaveLength(1);
    expect(items.map((item) => item.getAttribute('command'))).toEqual([
      'a',
      'b',
    ]);
    expect(items[0].getAttribute('shortcut')).toBe('Ctrl+W');
    expect(items.map((item) => item.getAttribute('label'))).toEqual([
      't:a',
      't:menu.b',
    ]);
  });

  it('names the menu after its heading and says it again when worded anew', () => {
    let language = 'en';
    const worded = drawMenu([row('a')], (key) => `${language}:${key}`, {
      header: { title: 'account.title' },
    });
    expect(worded.menu.getAttribute('aria-label')).toBe('en:account.title');

    language = 'de';
    worded.word();
    expect(worded.menu.getAttribute('aria-label')).toBe('de:account.title');
  });
});

import {
  LW_MENU_DISMISS,
  LW_MENU_SELECT,
  LwMenuElement,
} from '../elements/menu/lw-menu.element';
import {
  LW_TOOLBAR_SELECT,
  LwToolbarElement,
  LwToolbarSelectDetail,
} from '../elements/toolbar/lw-toolbar.element';
import { installLwToolbarHost } from '../elements/toolbar/toolbar-bridge';
import { drawMenu, MenuHeading, MenuRow } from '../menu/menu-drawing';
import type {
  LwSlotEntry,
  LwSlotHeader,
  LwSlotHost,
  LwSlotView,
  LwToolbarsApi,
} from './surface-kit.frame';

interface WatchedToolbar {
  readonly toolbar: LwToolbarElement;
  readonly onSelect: (event: Event) => void;
  subscription?: string;
  entries: readonly LwSlotEntry[];
}

interface OpenSubmenu {
  readonly owner: WatchedToolbar;
  readonly key: string;
  readonly trigger: HTMLElement;
  menu?: LwMenuElement;
}

function menuRow(entry: LwSlotEntry): MenuRow {
  return {
    key: entry.key,
    label: entry.label,
    group: entry.group ?? '',
    icon: entry.icon,
    shortcut: entry.shortcut,
    checkbox: entry.pressed !== undefined,
    checked: entry.pressed === true,
    disabled: entry.disabled,
  };
}

function menuHeading(header: LwSlotHeader): MenuHeading {
  return {
    header: {
      title: header.title,
      detail: header.detail,
      icon: header.icon,
      initials: header.initials,
      image: header.image,
    },
    leadsTo: header.leadsTo === undefined ? undefined : { title: header.leadsTo },
  };
}

const asWorded = (words: string): string => words;

export function createToolbars(): LwToolbarsApi {
  let host: LwSlotHost | undefined;
  const watched = new Map<LwToolbarElement, WatchedToolbar>();
  const bySubscription = new Map<string, WatchedToolbar>();
  const submenus = new Map<string, OpenSubmenu>();

  const watch = async (entry: WatchedToolbar): Promise<void> => {
    const slot = entry.toolbar.menu;
    if (!host || !slot) {
      return;
    }
    const id = String(await host.slotWatch(slot, entry.toolbar.context));
    entry.subscription = id;
    bySubscription.set(id, entry);
  };

  const unwatch = (entry: WatchedToolbar): void => {
    if (entry.subscription === undefined) {
      return;
    }
    host?.slotUnwatch(entry.subscription);
    bySubscription.delete(entry.subscription);
    entry.subscription = undefined;
  };

  const closeSubmenu = (id: string): void => {
    const open = submenus.get(id);
    if (!open) {
      return;
    }
    submenus.delete(id);
    open.menu?.remove();
    host?.slotUnwatch(id);
    open.owner.toolbar.openKey = null;
    open.trigger.focus();
  };

  const openSubmenu = async (
    owner: WatchedToolbar,
    key: string,
    trigger: HTMLElement,
  ): Promise<void> => {
    if (!host || owner.subscription === undefined) {
      return;
    }
    const id: unknown = await host.slotOpen(owner.subscription, key);
    if (typeof id !== 'string') {
      return;
    }
    submenus.set(id, { owner, key, trigger });
    owner.toolbar.openKey = key;
  };

  const drawSubmenu = (id: string, open: OpenSubmenu, view: LwSlotView): void => {
    open.menu?.remove();
    if (view.entries.length === 0 && view.header?.leadsTo === undefined) {
      closeSubmenu(id);
      return;
    }
    const { menu } = drawMenu(
      view.entries.map((entry) => menuRow(entry)),
      asWorded,
      view.header && menuHeading(view.header),
    );
    if (!view.header && view.label) {
      menu.setAttribute('aria-label', view.label);
    }
    menu.addEventListener(LW_MENU_SELECT, (event) => {
      const key = (event as CustomEvent<{ command: string | null }>).detail.command;
      if (key !== null) {
        host?.slotActivate(id, key);
      }
      closeSubmenu(id);
    });
    menu.addEventListener(LW_MENU_DISMISS, () => closeSubmenu(id));
    document.body.append(menu);
    menu.openBeside(open.trigger.getBoundingClientRect(), 'bottom');
    open.menu = menu;
  };

  const select = (entry: WatchedToolbar, detail: LwToolbarSelectDetail): void => {
    if (!host || entry.subscription === undefined) {
      return;
    }
    const drawn = entry.entries.find((candidate) => candidate.key === detail.key);
    if (drawn?.opensMenu) {
      void openSubmenu(entry, drawn.key, detail.trigger);
      return;
    }
    host.slotActivate(entry.subscription, detail.key);
  };

  installLwToolbarHost({
    attach(toolbar) {
      const entry: WatchedToolbar = {
        toolbar,
        entries: [],
        onSelect: (event) =>
          select(entry, (event as CustomEvent<LwToolbarSelectDetail>).detail),
      };
      toolbar.addEventListener(LW_TOOLBAR_SELECT, entry.onSelect);
      watched.set(toolbar, entry);
      void watch(entry);
    },
    changed(toolbar) {
      const entry = watched.get(toolbar);
      if (entry) {
        unwatch(entry);
        void watch(entry);
      }
    },
    detach(toolbar) {
      const entry = watched.get(toolbar);
      if (!entry) {
        return;
      }
      watched.delete(toolbar);
      toolbar.removeEventListener(LW_TOOLBAR_SELECT, entry.onSelect);
      unwatch(entry);
    },
  });

  document.addEventListener(
    'pointerdown',
    (event) => {
      for (const [id, open] of submenus) {
        if (!open.menu?.contains(event.target as Node | null)) {
          closeSubmenu(id);
        }
      }
    },
    { capture: true },
  );

  return {
    connect(next: LwSlotHost): void {
      host = next;
      for (const entry of watched.values()) {
        void watch(entry);
      }
    },
    apply(subscription: string, view: LwSlotView): void {
      const entry = bySubscription.get(subscription);
      if (entry) {
        entry.entries = view.entries;
        entry.toolbar.entries = view.entries;
        entry.toolbar.moreLabel = view.moreLabel;
        entry.toolbar.accessibleName = entry.toolbar.label ? null : view.label;
        return;
      }
      const open = submenus.get(subscription);
      if (open) {
        drawSubmenu(subscription, open, view);
      }
    },
  };
}

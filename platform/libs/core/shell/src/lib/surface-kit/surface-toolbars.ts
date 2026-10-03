import {
  LW_MENU_DISMISS,
  LW_MENU_ITEM_TAG,
  LW_MENU_SELECT,
  LW_MENU_TAG,
  LwMenuElement,
} from '../elements/menu/lw-menu.element';
import {
  LW_TOOLBAR_SELECT,
  LwToolbarElement,
  LwToolbarSelectDetail,
} from '../elements/toolbar/lw-toolbar.element';
import { installLwToolbarHost } from '../elements/toolbar/toolbar-bridge';
import type {
  LwSlotEntry,
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

function menuItem(entry: LwSlotEntry): HTMLElement {
  const item = document.createElement(LW_MENU_ITEM_TAG);
  item.setAttribute('label', entry.label);
  item.setAttribute('command', entry.key);
  if (entry.icon) {
    item.setAttribute('icon', entry.icon);
  }
  if (entry.shortcut) {
    item.setAttribute('shortcut', entry.shortcut);
  }
  if (entry.disabled) {
    item.setAttribute('disabled', '');
  }
  if (entry.pressed !== undefined) {
    item.setAttribute('checkbox', '');
    item.toggleAttribute('checked', entry.pressed);
  }
  return item;
}

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
    void host?.slotUnwatch(entry.subscription);
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
    void host?.slotUnwatch(id);
    open.owner.toolbar.openKey = null;
    open.trigger.focus();
  };

  const openSubmenu = async (
    owner: WatchedToolbar,
    entry: LwSlotEntry,
    trigger: HTMLElement,
  ): Promise<void> => {
    if (!host || !entry.submenu) {
      return;
    }
    const id = String(await host.slotWatch(entry.submenu, owner.toolbar.context));
    submenus.set(id, { owner, key: entry.key, trigger });
    owner.toolbar.openKey = entry.key;
  };

  const drawSubmenu = (id: string, open: OpenSubmenu, view: LwSlotView): void => {
    open.menu?.remove();
    if (view.entries.length === 0) {
      closeSubmenu(id);
      return;
    }
    const menu = document.createElement(LW_MENU_TAG) as LwMenuElement;
    menu.setAttribute('aria-label', view.label);
    menu.append(...view.entries.map((entry) => menuItem(entry)));
    menu.addEventListener(LW_MENU_SELECT, (event) => {
      const key = (event as CustomEvent<{ command: string | null }>).detail.command;
      if (key !== null) {
        void host?.slotActivate(id, key);
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
    if (drawn?.submenu) {
      void openSubmenu(entry, drawn, detail.trigger);
      return;
    }
    void host.slotActivate(entry.subscription, detail.key);
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
        entry.toolbar.label = view.label;
        return;
      }
      const open = submenus.get(subscription);
      if (open) {
        drawSubmenu(subscription, open, view);
      }
    },
  };
}

import { MenuContext } from '@loomweaver/plugin-sdk';
import { defineElementOnce, reflectAttribute, upgradeElementProperty } from '../custom-elements';
import { focusAndReveal, rovingTabIndex } from '../roving-focus';
import {
  cellIdOf,
  ENTRY_ATTRIBUTE,
  ENTRY_BUTTON_SELECTOR,
  ENTRY_SELECTOR,
  entryButton,
  FOLD_SELECTOR,
  focusStopsOf,
  isCellNode,
  nextToolbarId,
  orderOf,
  parseContext,
  reflectExpanded,
  RowItem,
} from './toolbar-dom';
import { LwToolbarEntry } from './toolbar-entry';
import { ToolbarLayout } from './toolbar-layout';
import {
  toolbarChanged,
  toolbarConnected,
  toolbarDisconnected,
} from './toolbar-bridge';

export const LW_TOOLBAR_TAG = 'lw-toolbar';

export const LW_TOOLBAR_SELECT = 'lw-toolbar-select';

export const LW_TOOLBAR_CONTEXT = 'lw-toolbar-context';

export type LwToolbarSize = 'sm' | 'md';

export type { LwToolbarEntry } from './toolbar-entry';

export interface LwToolbarSelectDetail {
  readonly key: string;
  readonly trigger: HTMLElement;
}

export interface LwToolbarContextDetail {
  readonly key: string;
  readonly x: number;
  readonly y: number;
}

export class LwToolbarElement extends HTMLElement {
  static readonly observedAttributes = ['menu', 'context', 'label', 'size'];

  private entriesValue: readonly LwToolbarEntry[] = [];

  private contextValue: MenuContext | undefined;

  private openKeyValue: string | null = null;

  private moreLabelValue = 'More';

  private active = 0;

  private rendering = false;

  private observer?: ResizeObserver;

  private childObserver?: MutationObserver;

  private readonly layout = new ToolbarLayout(
    this,
    nextToolbarId('--lw-toolbar-fold'),
    (open) => this.listenOutside(open),
  );

  get menu(): string | null {
    return this.getAttribute('menu');
  }

  set menu(value: string | null) {
    reflectAttribute(this, 'menu', value);
  }

  get label(): string | null {
    return this.getAttribute('label');
  }

  set label(value: string | null) {
    reflectAttribute(this, 'label', value);
  }

  get size(): LwToolbarSize {
    return this.getAttribute('size') === 'sm' ? 'sm' : 'md';
  }

  set size(value: LwToolbarSize | null) {
    reflectAttribute(this, 'size', value);
  }

  get context(): MenuContext {
    return this.contextValue ?? parseContext(this.getAttribute('context'));
  }

  set context(value: MenuContext | undefined) {
    this.contextValue = value;
    toolbarChanged(this);
  }

  get entries(): readonly LwToolbarEntry[] {
    return this.entriesValue;
  }

  set entries(value: readonly LwToolbarEntry[]) {
    this.entriesValue = value;
    this.refresh();
  }

  get openKey(): string | null {
    return this.openKeyValue;
  }

  set openKey(value: string | null) {
    this.openKeyValue = value;
    for (const button of this.entryButtons()) {
      reflectExpanded(button, value);
    }
  }

  get moreLabel(): string {
    return this.moreLabelValue;
  }

  set moreLabel(value: string) {
    this.moreLabelValue = value;
    this.layout.relabel(value);
  }

  connectedCallback(): void {
    for (const name of ['menu', 'label', 'size', 'context', 'entries', 'openKey', 'moreLabel']) {
      upgradeElementProperty(this, name);
    }
    this.setAttribute('role', 'toolbar');
    this.setAttribute('aria-orientation', 'horizontal');
    this.classList.add('lw-toolbar');
    this.addEventListener('click', this.onClick);
    this.addEventListener('contextmenu', this.onContextMenu);
    this.addEventListener('keydown', this.onKeydown);
    this.observe();
    this.render();
    toolbarConnected(this);
  }

  disconnectedCallback(): void {
    toolbarDisconnected(this);
    this.removeEventListener('click', this.onClick);
    this.removeEventListener('contextmenu', this.onContextMenu);
    this.removeEventListener('keydown', this.onKeydown);
    this.observer?.disconnect();
    this.observer = undefined;
    this.childObserver?.disconnect();
    this.childObserver = undefined;
    this.layout.closeTray();
  }

  attributeChangedCallback(name: string): void {
    if (!this.isConnected) {
      return;
    }
    if (name === 'label') {
      reflectAttribute(this, 'aria-label', this.label);
      return;
    }
    if (name === 'size') {
      this.classList.toggle('lw-toolbar--sm', this.size === 'sm');
      return;
    }
    toolbarChanged(this);
  }

  refresh(): void {
    if (this.isConnected) {
      this.render();
    }
  }

  buttonOf(key: string): HTMLButtonElement | null {
    return this.querySelector<HTMLButtonElement>(
      `button[data-lw-entry="${CSS.escape(key)}"]`,
    );
  }

  private readonly onClick = (event: MouseEvent): void => {
    const target = event.target as HTMLElement | null;
    if (target?.closest(FOLD_SELECTOR)) {
      this.layout.toggleTray();
      return;
    }
    const button = target?.closest<HTMLButtonElement>(ENTRY_SELECTOR);
    if (!button || button.disabled || !this.contains(button)) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent<LwToolbarSelectDetail>(LW_TOOLBAR_SELECT, {
        detail: { key: button.getAttribute(ENTRY_ATTRIBUTE) ?? '', trigger: button },
        bubbles: true,
      }),
    );
  };

  private readonly onContextMenu = (event: MouseEvent): void => {
    const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>(
      ENTRY_SELECTOR,
    );
    const key = button?.getAttribute(ENTRY_ATTRIBUTE) ?? null;
    const entry = this.entriesValue.find((candidate) => candidate.key === key);
    if (!button || !entry?.hasContextMenu) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.dispatchEvent(
      new CustomEvent<LwToolbarContextDetail>(LW_TOOLBAR_CONTEXT, {
        detail: { key: entry.key, x: event.clientX, y: event.clientY },
        bubbles: true,
      }),
    );
  };

  private readonly onKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.layout.isTrayOpen()) {
      this.layout.closeTray();
      this.layout.foldControl()?.focus();
      event.preventDefault();
      return;
    }
    const stops = focusStopsOf(this.children);
    if (stops.length === 0) {
      return;
    }
    const current = stops.indexOf(document.activeElement as HTMLElement);
    const index = current === -1 ? this.active : current;
    const next = this.stopAfter(event.key, index, stops.length);
    if (next === undefined) {
      return;
    }
    this.active = next;
    rovingTabIndex(stops, next);
    focusAndReveal(stops[next]);
    event.preventDefault();
  };

  private readonly onOutsidePointer = (event: PointerEvent): void => {
    if (!this.contains(event.target as Node | null)) {
      this.layout.closeTray();
    }
  };

  private stopAfter(key: string, index: number, count: number): number | undefined {
    switch (key) {
      case 'ArrowRight': {
        return (index + 1) % count;
      }
      case 'ArrowLeft': {
        return (index - 1 + count) % count;
      }
      case 'Home': {
        return 0;
      }
      case 'End': {
        return count - 1;
      }
      default: {
        return undefined;
      }
    }
  }

  private listenOutside(open: boolean): void {
    if (open) {
      document.addEventListener('pointerdown', this.onOutsidePointer, { capture: true });
    } else {
      document.removeEventListener('pointerdown', this.onOutsidePointer, { capture: true });
    }
  }

  private render(): void {
    this.rendering = true;
    try {
      this.draw();
    } finally {
      this.rendering = false;
    }
  }

  private draw(): void {
    const buttons = new Map(
      this.entryButtons().map((button) => [button.getAttribute(ENTRY_ATTRIBUTE) ?? '', button]),
    );
    const items = this.rowItems((entry) =>
      entryButton(entry, buttons.get(entry.key), this.openKeyValue),
    );
    for (const [key, button] of buttons) {
      if (this.entriesValue.every((entry) => entry.key !== key)) {
        button.remove();
      }
    }
    this.layout.layOut(items, this.moreLabelValue);
    reflectAttribute(this, 'aria-label', this.label);
    this.classList.toggle('lw-toolbar--sm', this.size === 'sm');
    this.toggleAttribute('hidden', items.length === 0);
    this.layout.measure(items, this.moreLabelValue);
    this.roveFocus();
  }

  private rowItems(nodeOf: (entry: LwToolbarEntry) => HTMLElement | null): RowItem[] {
    const sorted = [...this.entriesValue].toSorted((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const entries = sorted.flatMap((entry) => {
      const node = nodeOf(entry);
      return node ? [{ id: entry.key, order: entry.order ?? 0, group: entry.group, node }] : [];
    });
    const cells = this.cells().map((cell) => ({
      id: cellIdOf(cell),
      order: orderOf(cell),
      node: cell,
    }));
    return [...entries, ...cells].toSorted((a, b) => a.order - b.order);
  }

  private entryButtons(): HTMLButtonElement[] {
    return [...this.querySelectorAll<HTMLButtonElement>(ENTRY_BUTTON_SELECTOR)];
  }

  private cells(): HTMLElement[] {
    return [...this.children, ...(this.layout.tray()?.children ?? [])].filter(
      (child) => isCellNode(child),
    );
  }

  private roveFocus(): void {
    const stops = focusStopsOf(this.children);
    if (stops.length === 0) {
      return;
    }
    this.active = Math.min(this.active, stops.length - 1);
    rovingTabIndex(stops, this.active);
  }

  private observe(): void {
    if (typeof ResizeObserver !== 'undefined') {
      this.observer = new ResizeObserver(() => this.remeasure());
      this.observer.observe(this);
    }
    if (typeof MutationObserver !== 'undefined') {
      this.childObserver = new MutationObserver((mutations) => this.onChildren(mutations));
      this.childObserver.observe(this, { childList: true });
    }
  }

  private remeasure(): void {
    this.rendering = true;
    try {
      this.layout.measure(
        this.rowItems((entry) => this.buttonOf(entry.key)),
        this.moreLabelValue,
      );
      this.roveFocus();
    } finally {
      this.rendering = false;
    }
  }

  private onChildren(mutations: readonly MutationRecord[]): void {
    if (this.rendering) {
      return;
    }
    const foreign = mutations.some((mutation) =>
      [...mutation.addedNodes, ...mutation.removedNodes].some((node) => isCellNode(node)),
    );
    if (foreign) {
      this.render();
    }
  }
}

/** Registers `<lw-toolbar>` once (idempotent), called from {@link provideShell} at bootstrap. */
export function defineLwToolbar(): void {
  defineElementOnce(LW_TOOLBAR_TAG, LwToolbarElement);
}

import { entryWidth, FOLD_CONTROL_PX, foldedIds, sameIds } from '../row-fold';
import {
  FOCUSABLE_SELECTOR,
  FOLD_SELECTOR,
  FOLDED_ATTRIBUTE,
  foldControl,
  RowItem,
  SEPARATOR_CLASS,
  separator,
  tray,
  TRAY_CLASS,
} from './toolbar-dom';

const GAP_PX = 2;

export class ToolbarLayout {
  private folded: readonly string[] = [];

  private trayOpen = false;

  private readonly widths = new Map<string, number>();

  constructor(
    private readonly host: HTMLElement,
    private readonly anchorName: string,
    private readonly onTrayChange: (open: boolean) => void,
  ) {}

  isTrayOpen(): boolean {
    return this.trayOpen;
  }

  foldControl(): HTMLButtonElement | null {
    return this.host.querySelector<HTMLButtonElement>(`:scope > ${FOLD_SELECTOR}`);
  }

  tray(): HTMLElement | null {
    return this.host.querySelector<HTMLElement>(`:scope > .${TRAY_CLASS}`);
  }

  relabel(label: string): void {
    this.foldControl()?.setAttribute('aria-label', label);
    this.tray()?.setAttribute('aria-label', label);
  }

  layOut(items: readonly RowItem[], moreLabel: string): void {
    const folded = new Set(this.folded);
    const row = items.filter((item) => !folded.has(item.id));
    const away = items.filter((item) => folded.has(item.id));
    for (const old of this.host.querySelectorAll(`:scope > .${SEPARATOR_CLASS}`)) {
      old.remove();
    }
    let cursor: ChildNode | null = this.host.firstChild;
    let previousGroup: string | undefined;
    for (const [index, item] of row.entries()) {
      if (index > 0 && this.startsNewGroup(item, previousGroup)) {
        this.host.insertBefore(separator(), cursor);
      }
      if (item.node === cursor) {
        cursor = cursor.nextSibling;
      } else {
        this.host.insertBefore(item.node, cursor);
      }
      item.node.removeAttribute(FOLDED_ATTRIBUTE);
      previousGroup = item.group ?? previousGroup;
    }
    this.layOutFold(away, cursor, moreLabel);
  }

  measure(items: readonly RowItem[], moreLabel: string): void {
    const available = this.host.clientWidth;
    if (available <= 0 || items.length === 0) {
      return;
    }
    for (const item of items) {
      const width = entryWidth(item.node);
      if (width > 0) {
        this.widths.set(item.id, width);
      }
    }
    const folded = foldedIds([...items].toReversed(), {
      available,
      control: this.foldControl()?.getBoundingClientRect().width || FOLD_CONTROL_PX,
      gap: GAP_PX,
      widthOf: (id) => this.widths.get(id),
    });
    if (!sameIds(folded, this.folded)) {
      this.folded = folded;
      this.layOut(items, moreLabel);
    }
  }

  toggleTray(): void {
    if (this.trayOpen) {
      this.closeTray();
    } else {
      this.openTray();
    }
  }

  openTray(): void {
    const tray = this.tray();
    const control = this.foldControl();
    if (!tray || !control) {
      return;
    }
    this.trayOpen = true;
    tray.hidden = false;
    control.setAttribute('aria-expanded', 'true');
    this.onTrayChange(true);
    (tray.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ?? tray).focus?.();
  }

  closeTray(): void {
    if (!this.trayOpen) {
      return;
    }
    this.trayOpen = false;
    const tray = this.tray();
    if (tray) {
      tray.hidden = true;
    }
    this.foldControl()?.setAttribute('aria-expanded', 'false');
    this.onTrayChange(false);
  }

  private startsNewGroup(item: RowItem, previousGroup: string | undefined): boolean {
    return (
      item.group !== undefined &&
      previousGroup !== undefined &&
      item.group !== previousGroup
    );
  }

  private layOutFold(
    away: readonly RowItem[],
    cursor: ChildNode | null,
    moreLabel: string,
  ): void {
    let control = this.foldControl();
    let trayElement = this.tray();
    if (away.length === 0) {
      control?.remove();
      trayElement?.remove();
      this.trayOpen = false;
      return;
    }
    control ??= foldControl(moreLabel, this.anchorName);
    trayElement ??= tray(moreLabel, this.anchorName);
    if (control !== cursor) {
      this.host.insertBefore(control, cursor);
    }
    this.host.append(trayElement);
    for (const item of away) {
      item.node.setAttribute(FOLDED_ATTRIBUTE, '');
      trayElement.append(item.node);
    }
    trayElement.hidden = !this.trayOpen;
    control.setAttribute('aria-expanded', String(this.trayOpen));
  }
}

import { LW_MENU_TAG } from './lw-menu.element';

const focusReturns = new WeakMap<HTMLElement, HTMLElement>();

export function overlayMenuIn(root: Document): HTMLElement | undefined {
  return [...root.body.children].find(
    (child): child is HTMLElement => child.localName === LW_MENU_TAG,
  );
}

export function returnFocusTo(menu: HTMLElement, target: HTMLElement | null): void {
  if (target) {
    focusReturns.set(menu, target);
  }
}

export function focusReturnOf(menu: HTMLElement): HTMLElement | undefined {
  return focusReturns.get(menu);
}

export function inheritFocusReturn(root: Document, target: HTMLElement): boolean {
  const menu = overlayMenuIn(root);
  if (!menu?.contains(root.activeElement)) {
    return false;
  }
  if (!focusReturns.get(menu)?.isConnected) {
    focusReturns.set(menu, target);
  }
  return true;
}

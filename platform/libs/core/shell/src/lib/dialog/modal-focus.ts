import { overlayMenuIn } from '../elements/menu/overlay-menu';

const FOCUSABLE =
  'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

export function focusableIn(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)];
}

export function focusInto(root: HTMLElement, document: Document): void {
  const active = document.activeElement;
  if (root.contains(active) || overlayMenuIn(document)?.contains(active)) {
    return;
  }
  (root.querySelector<HTMLElement>('[data-lw-autofocus]') ?? root).focus();
}

export function pullFocusBackInto(
  root: HTMLElement,
  target: Node | null,
  document: Document,
): void {
  if (!target || root.contains(target)) {
    return;
  }
  if (!overlayMenuIn(document)?.contains(target)) {
    (focusableIn(root)[0] ?? root).focus();
  }
}

export function wrapFocusWithin(
  root: HTMLElement,
  active: Element | null,
  backward: boolean,
): boolean {
  const focusables = focusableIn(root);
  const first = focusables[0];
  const last = focusables.at(-1);
  if (backward && active === first) {
    last?.focus();
    return true;
  }
  if (!backward && active === last) {
    first?.focus();
    return true;
  }
  return false;
}

import {
  LwMenuElement,
  MenuAnchorRect,
  MenuSide,
} from '../elements/menu/lw-menu.element';

export type MenuAnchor =
  | { readonly x: number; readonly y: number }
  | { readonly rect: MenuAnchorRect; readonly side: MenuSide };

export function followed(
  at: MenuAnchor,
  trigger: HTMLElement | undefined,
  openedAt: DOMRect | undefined,
): MenuAnchor | null {
  if (trigger === undefined || openedAt === undefined) {
    return at;
  }
  const now = trigger.getBoundingClientRect();
  if (!trigger.isConnected || (now.width === 0 && now.height === 0)) {
    return null;
  }
  const dx = now.left - openedAt.left;
  const dy = now.top - openedAt.top;
  if (!('rect' in at)) {
    return { x: at.x + dx, y: at.y + dy };
  }
  return {
    rect: {
      left: at.rect.left + dx,
      top: at.rect.top + dy,
      right: at.rect.right + now.right - openedAt.right,
      bottom: at.rect.bottom + now.bottom - openedAt.bottom,
    },
    side: at.side,
  };
}

export function place(menu: LwMenuElement, at: MenuAnchor): void {
  if ('rect' in at) {
    menu.openBeside(at.rect, at.side);
  } else {
    menu.openAt(at.x, at.y);
  }
}

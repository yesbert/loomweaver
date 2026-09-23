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
): MenuAnchor {
  if (!trigger?.isConnected || openedAt === undefined) {
    return at;
  }
  const now = trigger.getBoundingClientRect();
  const dx = now.left - openedAt.left;
  const dy = now.top - openedAt.top;
  if (!('rect' in at)) {
    return { x: at.x + dx, y: at.y + dy };
  }
  const { left, top, right, bottom } = at.rect;
  return {
    rect: { left: left + dx, top: top + dy, right: right + dx, bottom: bottom + dy },
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

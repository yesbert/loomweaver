import { sanitizeIconSvg, setIcon } from '../elements/icon/icon-registry';
import { LW_ICON_TAG, LwIconElement } from '../elements/icon/lw-icon.element';
import type { LwSurfaceRenderState } from './surface-kit.frame';

export function applySurfaceState(state: LwSurfaceRenderState): void {
  const root = document.documentElement;
  for (const [name, value] of Object.entries(state.tokens ?? {})) {
    root.style.setProperty(name, value);
  }
  if (state.rootFontSize) {
    root.style.fontSize = state.rootFontSize;
  }
  if (state.theme) {
    const dark = state.theme === 'dark';
    root.classList.toggle('dark', dark);
    document.body?.classList.toggle('dark', dark);
  }
  applyIcons(state.icons);
}

function applyIcons(icons: Readonly<Record<string, string>> | undefined): void {
  const entries = Object.entries(icons ?? {});
  if (entries.length === 0) {
    return;
  }
  for (const [name, svg] of entries) {
    setIcon(name, sanitizeIconSvg(svg));
  }
  for (const element of document.querySelectorAll(LW_ICON_TAG)) {
    (element as LwIconElement).refresh();
  }
}

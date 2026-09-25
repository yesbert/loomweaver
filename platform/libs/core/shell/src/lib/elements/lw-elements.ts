import { defineLwButton } from './button/lw-button.element';
import { defineLwIcon } from './icon/lw-icon.element';
import { defineLwMarkdown } from './markdown/lw-markdown.element';
import { defineLwMenu } from './menu/lw-menu.element';
import { defineLwNavTree } from './nav-tree/lw-nav-tree.element';
import { defineLwProgressRing } from './progress/lw-progress-ring.element';
import { defineLwSelect } from './select/lw-select.element';
import { defineLwTooltip } from './tooltip/lw-tooltip.element';

export const LW_ELEMENT_DEFINITIONS: readonly (() => void)[] = [
  defineLwIcon,
  defineLwTooltip,
  defineLwSelect,
  defineLwNavTree,
  defineLwMenu,
  defineLwMarkdown,
  defineLwButton,
  defineLwProgressRing,
];

export function defineLwElements(): void {
  for (const define of LW_ELEMENT_DEFINITIONS) {
    define();
  }
}

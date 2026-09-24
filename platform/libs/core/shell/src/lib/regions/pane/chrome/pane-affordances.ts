import { SwitchSignals } from '../../../features/feature-switches.service';
import { ContentFeatures } from '../../../foundation/shell-features';

type ContentSwitches = SwitchSignals<ContentFeatures>;

export function offersSplitRight(content: ContentSwitches): boolean {
  return content.splitRight() && content.splitRightButton();
}

export function offersSplitDown(content: ContentSwitches): boolean {
  return content.splitDown() && content.splitDownButton();
}

export function offersMinimize(
  content: ContentSwitches,
  pane: { readonly split: boolean; readonly maximized: boolean },
): boolean {
  return content.minimize() && pane.split && !pane.maximized;
}

export function tabsReorderable(
  content: ContentSwitches,
  contentSide: boolean,
): boolean {
  return !contentSide || content.reorderTabs();
}

export function tabsDraggable(
  content: ContentSwitches,
  contentSide: boolean,
): boolean {
  return (
    !contentSide ||
    content.reorderTabs() ||
    content.moveTabs() ||
    content.splitRight() ||
    content.splitDown()
  );
}

export function escalationSwitches(content: ContentSwitches): {
  readonly escalate: boolean;
  readonly pin: boolean;
} {
  return { escalate: content.escalate(), pin: content.pin() };
}

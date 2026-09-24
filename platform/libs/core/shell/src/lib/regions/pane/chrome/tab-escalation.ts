import { isViewPanePath } from '../tree/pane-address';
import { StripTab } from './strip-tab';

export type EscalationStep = 'keep' | 'pin' | 'unpin';

export function escalationStep(
  tab: StripTab,
  allowed: { readonly escalate: boolean; readonly pin: boolean },
): EscalationStep | null {
  if (!allowed.escalate || isViewPanePath(tab.path)) {
    return null;
  }
  if (tab.preview) {
    return 'keep';
  }
  if (!allowed.pin) {
    return null;
  }
  if (tab.pinned) {
    return 'unpin';
  }
  return tab.closable ? 'pin' : null;
}

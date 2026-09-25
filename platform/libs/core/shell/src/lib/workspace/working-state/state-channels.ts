import { HIDDEN_VIEWS_KEY } from '../../regions/panel/hidden-views.service';
import { PANE_TREES_KEY } from '../../regions/pane/tree/pane-tree-storage';

export const WORKSPACE_STATE_KEYS = [HIDDEN_VIEWS_KEY, PANE_TREES_KEY] as const;

export type WorkspaceStateKey = (typeof WORKSPACE_STATE_KEYS)[number];

export interface StateChannel {
  readonly hydrate: (raw: string | undefined) => void;
  readonly serialize: () => string;
}

export type StateChannels = Readonly<Record<WorkspaceStateKey, StateChannel>>;

export function stateChannels(
  hiddenViews: StateChannel,
  paneTree: StateChannel,
): StateChannels {
  return {
    [HIDDEN_VIEWS_KEY]: {
      hydrate: (raw) => hiddenViews.hydrate(raw),
      serialize: () => hiddenViews.serialize(),
    },
    [PANE_TREES_KEY]: {
      hydrate: (raw) => paneTree.hydrate(raw),
      serialize: () => paneTree.serialize(),
    },
  };
}

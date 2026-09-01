import { KeyValueStore } from '../persistence/key-value-store';
import { readStoredValue } from '../persistence/hydrate';
import { workspaceScopedKey } from './active-workspace.service';
import {
  WorkspaceDefinition,
  workspaceBaseline,
} from './workspace-definition';

export const WORKSPACES_KEY = 'lw.shell.workspaces';

export const HIDDEN_VIEWS_KEY = 'lw.shell.hidden-views';

export const PANE_TREES_KEY = 'lw.shell.pane-trees';

export const WORKSPACE_KEYS = [HIDDEN_VIEWS_KEY, PANE_TREES_KEY] as const;

export interface Workspace {
  readonly id: string;
  readonly name: string;
  readonly baseline: Readonly<Record<string, string>>;
  readonly origin?: string;
}

export function parseWorkspaces(raw: string | undefined): Workspace[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (workspace): workspace is Workspace =>
        !!workspace &&
        typeof (workspace as Workspace).id === 'string' &&
        typeof (workspace as Workspace).name === 'string' &&
        typeof (workspace as Workspace).baseline === 'object' &&
        (workspace as Workspace).baseline !== null &&
        !Array.isArray((workspace as Workspace).baseline),
    );
  } catch {
    return [];
  }
}

export interface StateChannel {
  readonly hydrate: (raw: string | undefined) => void;
  readonly serialize: () => string;
}

export function stateChannels(
  hiddenViews: { hydrate: (raw: string | undefined) => void; serialize: () => string },
  paneTree: { hydrate: (raw: string | undefined) => void; serialize: () => string },
  keys: { readonly hiddenViews: string; readonly paneTrees: string },
): Record<string, StateChannel> {
  return {
    [keys.hiddenViews]: {
      hydrate: (raw) => hiddenViews.hydrate(raw),
      serialize: () => hiddenViews.serialize(),
    },
    [keys.paneTrees]: {
      hydrate: (raw) => paneTree.hydrate(raw),
      serialize: () => paneTree.serialize(),
    },
  };
}

export interface BaselineDeps {
  readonly panelRegions: readonly string[];
  readonly declaredPaths: (region: string) => readonly string[];
  readonly hiddenViewsKey: string;
  readonly paneTreesKey: string;
}

export function definitionBaseline(
  definition: WorkspaceDefinition,
  deps: BaselineDeps,
): Record<string, string> {
  const state = workspaceBaseline(definition, {
    panelRegions: deps.panelRegions,
    declaredPaths: deps.declaredPaths,
  });
  return {
    ...(state.hiddenViews !== undefined && {
      [deps.hiddenViewsKey]: state.hiddenViews,
    }),
    ...(state.trees !== undefined && { [deps.paneTreesKey]: state.trees }),
  };
}

export async function readWorkspaceState(
  store: KeyValueStore,
  scopedKey: (key: string) => string,
  keys: readonly string[],
): Promise<Record<string, string>> {
  const state: Record<string, string> = {};
  for (const key of keys) {
    const raw = await readStoredValue(store, scopedKey(key));
    if (raw != null) {
      state[key] = raw;
    }
  }
  return state;
}

export function writeWorkspaceState(
  store: KeyValueStore,
  id: string,
  state: Readonly<Record<string, string>>,
  keys: readonly string[],
): void {
  for (const key of keys) {
    const scoped = workspaceScopedKey(key, id);
    const value = state[key];
    if (value === undefined) {
      void store.delete(scoped);
    } else {
      void store.set(scoped, value);
    }
  }
}

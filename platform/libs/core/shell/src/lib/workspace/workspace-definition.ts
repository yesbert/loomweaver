export const DEFAULT_WORKSPACE_ID = 'default';

import {
  PaneArea,
  PaneAreaBase,
  PaneColumnArea,
  PaneRowArea,
  PaneTabArea,
} from '@loomweaver/plugin-sdk';
import {
  BakedTab,
  PaneAreaTree,
  paneAreaTree,
} from '../regions/pane/tree/pane-area-tree';
import { conflictingClaims, type WorkspaceClaim } from './workspace-claims';
import { CONTENT_DOCK, VIEW_PANE_PREFIX } from '../regions/pane/tree/pane-address';
import { normalizeNode } from '../regions/pane/tree/pane-restore';

/**
 * A developer-defined workspace a distribution ships with {@link provideWorkspaces}: the same thing a
 * user can build and save, only its baseline lives in code — it is never written to storage, the user
 * cannot overwrite, rename or delete it, and it moves with product updates. Switching, the automatic
 * per-workspace working state and **Reset** (back to this declaration) work exactly as for a
 * user-saved workspace.
 */
export interface WorkspaceDefinition {
  /**
   * Stable identity — keys the workspace's working state. `default` is reserved for the built-in
   * empty workspace; a duplicate id keeps the first declaration.
   */
  readonly id: string;
  /** Display name — a translation key; a literal string falls back to itself. */
  readonly title: string;
  /** Optional icon (registry name) shown next to the name in the workspace management UI. */
  readonly icon?: string;
  /**
   * Makes this the workspace a fresh install opens in, instead of the empty `default` one. It applies
   * **once**, on a first boot with nothing stored yet: from then on the user's own last choice wins,
   * so switching away is not undone by the next reload. A deep link still wins over the declaration —
   * the baseline is laid out, but an incoming address is navigated to, so a shared link opens what it
   * names. If two declarations set this, the first one wins, as with a duplicate id.
   */
  readonly initial?: boolean;
  /**
   * Which views each sidebar shows, keyed by the **panel region id** of your layout. A listed region
   * shows exactly the named views; everything else declared for it is hidden and can be brought back
   * through the strip's context menu. List a region with an **empty array** to show none of its views
   * — the sidebar itself stays, empty. A region you leave out, or omitting the whole field, keeps
   * whatever the user has there. **Whether a sidebar exists, is open and how wide it is belongs to the
   * window, not to the workspace**: your layout decides which sidebars the app has, the user decides
   * whether they are open, and switching workspaces never collapses, resizes or removes one.
   */
  readonly sidebars?: Readonly<Record<string, readonly string[]>>;
  /**
   * The content addresses that belong to this workspace, as route paths in the same vocabulary as
   * {@link content} — `quotes/:id` claims every quote document and everything below one. Reaching a
   * claimed address activates this workspace and shows the content inside it, **however the address
   * was reached**: a link followed into the application, a restart, a command, a programmatic
   * navigation or a tab a plugin opened. Without a claim an address is shown wherever the user
   * already is, which is the behaviour of every workspace that declares none.
   *
   * Where two workspaces claim addresses of the same shape, neither is narrower and the claim is
   * dropped from both with a message naming them; a narrower claim (more segments, or fewer
   * parameters at the same length) simply wins. A workspace the **user** saved is never a
   * destination, however it came by its claim — it exists on one machine only, and an address that
   * led somewhere different for every user would not be an address.
   */
  readonly claims?: readonly string[];
  /**
   * The content area as a recursive arrangement: an area either holds `tabs`, splits into `rows`
   * (top to bottom) or splits into `columns` (left to right). The **first** tabs area in reading
   * order becomes the URL pane; switching to the workspace navigates to its active tab. Omit to
   * start on the empty layout.
   */
  readonly content?: WorkspaceArea;
}

/**
 * One node of a {@link WorkspaceDefinition} content declaration — the shared {@link PaneArea} grammar
 * over route paths. A container declares its own arrangement in the same grammar over
 * child surface ids.
 */
export type WorkspaceArea = PaneArea<WorkspaceTabEntry>;

export type WorkspaceAreaBase = PaneAreaBase;

/** An area that holds tabs. */
export type WorkspaceTabArea = PaneTabArea<WorkspaceTabEntry>;

/** An area that splits into rows, top to bottom. */
export type WorkspaceRowArea = PaneRowArea<WorkspaceTabEntry>;

/** An area that splits into columns, left to right. */
export type WorkspaceColumnArea = PaneColumnArea<WorkspaceTabEntry>;

/** A tab in a workspace declaration — a route path, or the object form for the extra flags. */
export type WorkspaceTabEntry = string | WorkspaceTab;

export interface WorkspaceTab {
  /** The surface route path the tab opens (sidebar views belong under `sidebars`, not here). */
  readonly path: string;
  /**
   * `false` fixes the tab in this workspace: it shows no close affordance, "close others" and
   * "close all" spare it, and it cannot be dragged away. Reset restores it either way.
   */
  readonly closable?: boolean;
  /** Marks the area's initially active tab; without it the first tab is active. */
  readonly active?: boolean;
}

export interface WorkspaceBaselineState {
  readonly trees?: string;
  readonly hiddenViews?: string;
}

export interface WorkspaceBaselineDeps {
  readonly panelRegions: readonly string[];
  readonly declaredPaths: (regionId: string) => readonly string[];
}

export function auditWorkspaceDefinitions(
  definitions: readonly WorkspaceDefinition[],
  panelRegions: readonly string[],
): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  let initial: string | null = null;
  for (const definition of definitions) {
    if (definition.id === DEFAULT_WORKSPACE_ID) {
      problems.push(
        `Workspace definition id "default" collides with the built-in default workspace — the definition is ignored.`,
      );
      continue;
    }
    if (seen.has(definition.id)) {
      problems.push(
        `Workspace "${definition.id}" is declared twice — the later declaration is ignored.`,
      );
      continue;
    }
    seen.add(definition.id);
    if (definition.initial) {
      if (initial === null) {
        initial = definition.id;
      } else {
        problems.push(
          `Workspace "${definition.id}" also declares initial: true — "${initial}" already does, so this one is ignored.`,
        );
      }
    }
    auditDefinition(definition, panelRegions, problems);
  }
  problems.push(...conflictingClaims(claimsOf(definitions)));
  return problems;
}

export function claimsOf(
  definitions: readonly WorkspaceDefinition[],
): readonly WorkspaceClaim[] {
  return dedupedDefinitions(definitions).flatMap((definition) =>
    (definition.claims ?? []).map((pattern) => ({
      workspaceId: definition.id,
      pattern,
    })),
  );
}

function auditDefinition(
  definition: WorkspaceDefinition,
  panelRegions: readonly string[],
  problems: string[],
): void {
  if (definition.content !== undefined) {
    const { node } = contentTree(definition, problems);
    if (node === null) {
      problems.push(
        `Workspace "${definition.id}": the content declaration is invalid — it is ignored and the workspace starts on the empty layout.`,
      );
    }
  }
  for (const region of Object.keys(definition.sidebars ?? {})) {
    if (!panelRegions.includes(region)) {
      problems.push(
        `Workspace "${definition.id}": sidebars names "${region}", which is no panel region of this layout — the entry is ignored.`,
      );
    }
  }
}

export function dedupedDefinitions(
  definitions: readonly WorkspaceDefinition[],
): WorkspaceDefinition[] {
  const seen = new Set<string>([DEFAULT_WORKSPACE_ID]);
  return definitions.filter((definition) => {
    if (seen.has(definition.id)) {
      return false;
    }
    seen.add(definition.id);
    return true;
  });
}

export function workspaceBaseline(
  definition: WorkspaceDefinition,
  deps: WorkspaceBaselineDeps,
): WorkspaceBaselineState {
  return {
    ...baselineTrees(definition),
    ...baselineSidebars(definition, deps),
  };
}

function baselineTrees(
  definition: WorkspaceDefinition,
): Pick<WorkspaceBaselineState, 'trees'> {
  if (definition.content === undefined) {
    return {};
  }
  const { node } = contentTree(definition, []);
  const tree = node === null ? null : normalizeNode(node);
  return tree === null
    ? {}
    : { trees: JSON.stringify({ [CONTENT_DOCK]: tree }) };
}

function baselineSidebars(
  definition: WorkspaceDefinition,
  deps: WorkspaceBaselineDeps,
): Pick<WorkspaceBaselineState, 'hiddenViews'> {
  const sidebars = definition.sidebars;
  if (sidebars === undefined) {
    return {};
  }
  const listed = deps.panelRegions.filter((region) => region in sidebars);
  const hidden = listed
    .flatMap((region) =>
      deps
        .declaredPaths(region)
        .map((path) => path.slice(VIEW_PANE_PREFIX.length))
        .filter((id) => !sidebars[region].includes(id)),
    )
    .sort((a, b) => a.localeCompare(b));
  return hidden.length === 0 ? {} : { hiddenViews: JSON.stringify(hidden) };
}

export function declaredTabPaths(definition: WorkspaceDefinition): string[] {
  if (definition.content === undefined) {
    return [];
  }
  return contentTree(definition, []).tabs.map((tab) => tab.path);
}

function contentTree(
  definition: WorkspaceDefinition,
  problems: string[],
): PaneAreaTree {
  return definition.content === undefined
    ? { node: null, tabs: [] }
    : paneAreaTree(
        definition.content,
        {
          context: `Workspace "${definition.id}"`,
          idPrefix: `ws:${definition.id}`,
          bake: (entry, found) => bakeTab(definition.id, entry, found),
        },
        problems,
      );
}

function bakeTab(
  definitionId: string,
  entry: WorkspaceTabEntry,
  problems: string[],
): BakedTab | null {
  const tab = typeof entry === 'string' ? { path: entry } : entry;
  if (tab.path.startsWith(VIEW_PANE_PREFIX)) {
    problems.push(
      `Workspace "${definitionId}": content tabs cannot hold sidebar views ("${tab.path}") — ` +
        `declare the view under sidebars instead; the tab is dropped.`,
    );
    return null;
  }
  return {
    tab: {
      path: tab.path,
      ...(tab.closable === false && { closable: false }),
    },
    active: tab.active === true,
  };
}

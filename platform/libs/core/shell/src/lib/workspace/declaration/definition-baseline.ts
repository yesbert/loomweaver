import { HIDDEN_VIEWS_KEY } from '../../regions/panel/hidden-views.service';
import { PANE_TREES_KEY } from '../../regions/pane/tree/pane-tree-storage';
import {
  CONTENT_DOCK,
  VIEW_PANE_PREFIX,
} from '../../regions/pane/tree/pane-address';
import { normalizeNode } from '../../regions/pane/tree/stored-pane-tree';
import { contentTree } from './declared-content';
import { WorkspaceDefinition } from './workspace-definition';

export interface PanelDeclarations {
  readonly panelRegions: readonly string[];
  readonly declaredPaths: (region: string) => readonly string[];
}

export function definitionBaseline(
  definition: WorkspaceDefinition,
  panels: PanelDeclarations,
): Readonly<Record<string, string>> {
  const hiddenViews = baselineHiddenViews(definition, panels);
  const trees = baselineTrees(definition);
  return {
    ...(hiddenViews !== undefined && { [HIDDEN_VIEWS_KEY]: hiddenViews }),
    ...(trees !== undefined && { [PANE_TREES_KEY]: trees }),
  };
}

export function baselineTrees(
  definition: WorkspaceDefinition,
): string | undefined {
  if (definition.content === undefined) {
    return undefined;
  }
  const { node } = contentTree(definition, []);
  const tree = node === null ? null : normalizeNode(node);
  return tree === null ? undefined : JSON.stringify({ [CONTENT_DOCK]: tree });
}

export function baselineHiddenViews(
  definition: WorkspaceDefinition,
  panels: PanelDeclarations,
): string | undefined {
  const sidebars = definition.sidebars;
  if (sidebars === undefined) {
    return undefined;
  }
  const listed = panels.panelRegions.filter((region) =>
    Object.hasOwn(sidebars, region),
  );
  const hidden = listed
    .flatMap((region) =>
      panels
        .declaredPaths(region)
        .map((path) => path.slice(VIEW_PANE_PREFIX.length))
        .filter((id) => !sidebars[region].includes(id)),
    )
    .toSorted((a, b) => a.localeCompare(b));
  return hidden.length === 0 ? undefined : JSON.stringify(hidden);
}

import { HIDDEN_VIEWS_KEY } from '../../regions/panel/hidden-views.service';
import { PANE_TREES_KEY } from '../../regions/pane/tree/pane-tree-storage';
import {
  PanelDeclarations,
  WorkspaceDefinition,
  baselineHiddenViews,
  baselineTrees,
} from '../workspace-definition';

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

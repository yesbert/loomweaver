import {
  BakedTab,
  PaneAreaTree,
  paneAreaTree,
} from '../../regions/pane/tree/declared-pane-layout';
import { isViewPanePath } from '../../regions/pane/tree/pane-address';
import { WorkspaceDefinition, WorkspaceTabEntry } from './workspace-definition';

export function declaredTabPaths(definition: WorkspaceDefinition): string[] {
  if (definition.content === undefined) {
    return [];
  }
  return contentTree(definition, []).tabs.map((tab) => tab.path);
}

export function contentTree(
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
  if (isViewPanePath(tab.path)) {
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

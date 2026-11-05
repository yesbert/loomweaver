import { PaneNode } from '../tree/pane-node';
import { leavesOf } from '../tree/pane-queries';
import { paneRetentionScope } from './retention-keys';

export type DockTrees = Readonly<Record<string, PaneNode>>;

export interface DepartedTab {
  readonly scope: string;
  readonly path: string;
}

export function openPathsByScope(trees: DockTrees): Map<string, Set<string>> {
  const open = new Map<string, Set<string>>();
  for (const [dock, tree] of Object.entries(trees)) {
    for (const leaf of leavesOf(tree)) {
      const scope = paneRetentionScope(dock, leaf.id);
      const paths = open.get(scope) ?? new Set<string>();
      for (const tab of leaf.tabs) {
        paths.add(tab.path);
      }
      open.set(scope, paths);
    }
  }
  return open;
}

export function tabsLeavingTheirPane(
  before: DockTrees,
  after: DockTrees,
): DepartedTab[] {
  const holding = openPathsByScope(after);
  const departed: DepartedTab[] = [];
  for (const [scope, paths] of openPathsByScope(before)) {
    for (const path of paths) {
      if (!holding.get(scope)?.has(path)) {
        departed.push({ scope, path });
      }
    }
  }
  return departed;
}

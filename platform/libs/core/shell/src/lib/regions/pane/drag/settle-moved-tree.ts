import { PRIMARY_LEAF, PaneNode } from '../tree/pane-node';
import { findLeaf } from '../tree/pane-queries';
import { removeLeaf } from '../tree/pane-structure';
import { isContainerDock } from '../container/container-children';

export function settleMovedTree(
  dock: string,
  node: PaneNode,
  primaryId: string,
): PaneNode {
  if (!isContainerDock(dock) || node.kind !== 'split') {
    return node;
  }
  const primary = findLeaf(node, primaryId);
  if (!primary || primary.tabs.length > 0 || primary.declared) {
    return node;
  }
  return removeLeaf(node, primaryId) ?? PRIMARY_LEAF;
}

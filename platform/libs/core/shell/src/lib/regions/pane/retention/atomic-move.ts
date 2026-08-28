interface MovableParent extends Node {
  moveBefore(node: Node, child: Node | null): void;
}

function movable(parent: Node | null | undefined): parent is MovableParent {
  return (
    typeof (parent as Partial<MovableParent> | null | undefined)?.moveBefore ===
    'function'
  );
}

export function supportsAtomicMove(document: Document): boolean {
  return movable(document.body ?? document.documentElement);
}

export function moveNode(
  parent: Node,
  node: Node,
  before: Node | null,
): boolean {
  if (!movable(parent) || !node.isConnected) {
    parent.insertBefore(node, before);
    return false;
  }
  try {
    parent.moveBefore(node, before);
    return true;
  } catch {
    parent.insertBefore(node, before);
    return false;
  }
}

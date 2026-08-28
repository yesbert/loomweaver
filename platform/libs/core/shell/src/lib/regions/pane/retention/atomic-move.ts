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

function insertNode(parent: Node, node: Node, before: Node | null): void {
  if (before === null) {
    (parent as ParentNode).append(node);
    return;
  }
  (before as ChildNode).before(node);
}

export function moveNode(
  parent: Node,
  node: Node,
  before: Node | null,
): boolean {
  if (!movable(parent) || !node.isConnected) {
    insertNode(parent, node, before);
    return false;
  }
  try {
    parent.moveBefore(node, before);
    return true;
  } catch {
    insertNode(parent, node, before);
    return false;
  }
}

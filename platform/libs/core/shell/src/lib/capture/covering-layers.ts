export interface Placed {
  readonly element: Element;
  readonly rect: DOMRect;
}

export interface CoverPass {
  readonly layer: Placed;
  readonly covers: readonly number[];
  readonly holds: readonly number[];
}

export interface PaintPlan {
  readonly beneath: readonly number[];
  readonly passes: readonly CoverPass[];
}

interface Layer extends Placed {
  readonly depth: number;
  readonly nested: readonly Layer[];
}

interface Painted {
  readonly layer: Layer;
  readonly outermost: Layer;
}

interface Stacking {
  readonly depth: number;
  readonly anchor: Element | undefined;
}

export function paintPlan(
  root: Element,
  surfaces: readonly Placed[],
  view: Window,
): PaintPlan {
  const painted = inPaintOrder(layersUnder(root, view));
  const holder = surfaces.map(
    (surface) =>
      painted.findLast(({ layer }) => holds(layer.element, surface.element))
        ?.layer,
  );
  const stacking = surfaces.map((surface) =>
    stackingOf(surface.element, root, view),
  );
  const heldBy = (layer: Layer | undefined): number[] =>
    surfaces.flatMap((_, index) => (holder[index] === layer ? [index] : []));

  const beneath = heldBy(undefined);
  const drawn = [...beneath];
  const passes: CoverPass[] = [];
  for (const { layer, outermost } of painted) {
    const covers = drawn.filter(
      (index) =>
        overlap(layer.rect, surfaces[index].rect) &&
        (holder[index] !== undefined || isAbove(outermost, stacking[index])),
    );
    const holds = heldBy(layer);
    if (covers.length > 0 || holds.length > 0) {
      passes.push({ layer, covers, holds });
    }
    drawn.push(...holds);
  }
  return { beneath, passes };
}

function layersUnder(parent: Element, view: Window): readonly Layer[] {
  const found: Layer[] = [];
  for (const child of childrenOf(parent)) {
    const style = view.getComputedStyle(child);
    if (style.position !== 'fixed') {
      found.push(...layersUnder(child, view));
      continue;
    }
    found.push({
      element: child,
      rect: child.getBoundingClientRect(),
      depth: zIndexOf(style) ?? 0,
      nested: layersUnder(child, view),
    });
  }
  return found.toSorted((a, b) => a.depth - b.depth);
}

function childrenOf(parent: Element): readonly Element[] {
  return [...parent.children, ...(parent.shadowRoot?.children ?? [])];
}

function inPaintOrder(
  layers: readonly Layer[],
  outer?: Layer,
): readonly Painted[] {
  return layers.flatMap((layer) => [
    { layer, outermost: outer ?? layer },
    ...inPaintOrder(layer.nested, outer ?? layer),
  ]);
}

function stackingOf(element: Element, root: Element, view: Window): Stacking {
  let stacking: Stacking = { depth: 0, anchor: undefined };
  let indexed = false;
  for (
    let node: Element | undefined = element;
    node && node !== root;
    node = composedParent(node)
  ) {
    const style = view.getComputedStyle(node);
    if (style.position === 'static') {
      continue;
    }
    const depth = zIndexOf(style);
    if (depth !== undefined) {
      stacking = { depth, anchor: node };
      indexed = true;
    } else if (!indexed) {
      stacking = { depth: 0, anchor: node };
    }
  }
  return stacking;
}

function isAbove(layer: Layer, surface: Stacking): boolean {
  if (layer.depth !== surface.depth) {
    return layer.depth > surface.depth;
  }
  return surface.anchor === undefined || follows(layer.element, surface.anchor);
}

function follows(later: Element, earlier: Element): boolean {
  const position = inDocument(earlier).compareDocumentPosition(
    inDocument(later),
  );
  return (position & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
}

function inDocument(element: Element): Element {
  let node = element;
  let root = node.getRootNode();
  while (root instanceof ShadowRoot) {
    node = root.host;
    root = node.getRootNode();
  }
  return node;
}

function holds(outer: Element, inner: Element): boolean {
  for (
    let node: Element | undefined = inner;
    node;
    node = composedParent(node)
  ) {
    if (node === outer) {
      return true;
    }
  }
  return false;
}

function composedParent(element: Element): Element | undefined {
  if (element.parentElement) {
    return element.parentElement;
  }
  const root = element.getRootNode();
  return root instanceof ShadowRoot ? root.host : undefined;
}

function zIndexOf(style: CSSStyleDeclaration): number | undefined {
  const depth = Number.parseInt(style.zIndex, 10);
  return Number.isNaN(depth) ? undefined : depth;
}

function overlap(a: DOMRect, b: DOMRect): boolean {
  return (
    a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
  );
}

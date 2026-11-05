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

export function paintPlan(
  root: Element,
  surfaces: readonly Placed[],
  view: Window,
): PaintPlan {
  const layers = inPaintOrder(layersUnder(root, surfaces, view));
  const holder = surfaces.map((surface) =>
    layers.findLast((layer) => layer.element.contains(surface.element)),
  );
  const heldBy = (layer: Layer | undefined): number[] =>
    surfaces.flatMap((_, index) => (holder[index] === layer ? [index] : []));

  const beneath = heldBy(undefined);
  const drawn = [...beneath];
  const passes: CoverPass[] = [];
  for (const layer of layers) {
    const covers = drawn.filter((index) =>
      overlap(layer.rect, surfaces[index].rect),
    );
    const holds = heldBy(layer);
    if (covers.length > 0 || holds.length > 0) {
      passes.push({ layer, covers, holds });
    }
    drawn.push(...holds);
  }
  return { beneath, passes };
}

function layersUnder(
  parent: Element,
  surfaces: readonly Placed[],
  view: Window,
): readonly Layer[] {
  const found: Layer[] = [];
  for (const child of parent.children) {
    const style = view.getComputedStyle(child);
    if (style.position !== 'fixed') {
      found.push(...layersUnder(child, surfaces, view));
      continue;
    }
    const holdsSurface = surfaces.some((surface) =>
      child.contains(surface.element),
    );
    found.push({
      element: child,
      rect: child.getBoundingClientRect(),
      depth: Number.parseInt(style.zIndex, 10) || 0,
      nested: holdsSurface ? layersUnder(child, surfaces, view) : [],
    });
  }
  return found.toSorted((a, b) => a.depth - b.depth);
}

function inPaintOrder(layers: readonly Layer[]): readonly Layer[] {
  return layers.flatMap((layer) => [layer, ...inPaintOrder(layer.nested)]);
}

function overlap(a: DOMRect, b: DOMRect): boolean {
  return (
    a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
  );
}

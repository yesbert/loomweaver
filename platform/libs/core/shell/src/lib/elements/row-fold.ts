export const FOLD_CONTROL_PX = 28;

export function entryWidth(node: HTMLElement): number {
  return Math.max(node.getBoundingClientRect().width, node.scrollWidth);
}

export function closeOnOutsidePointer(
  document: Document,
  inside: (target: Node | null) => boolean,
  close: () => void,
): () => void {
  const onPointer = (event: PointerEvent): void => {
    if (!inside(event.target as Node | null)) {
      close();
    }
  };
  document.addEventListener('pointerdown', onPointer, { capture: true });
  return () =>
    document.removeEventListener('pointerdown', onPointer, { capture: true });
}

export interface FoldMeasure {
  readonly available: number;
  readonly control: number;
  readonly gap: number;
  readonly widthOf: (id: string) => number | undefined;
}

export interface Foldable {
  readonly id: string;
}

export function foldedIds(
  rank: readonly Foldable[],
  measure: FoldMeasure,
): readonly string[] {
  const kept = [...rank];
  if (rowWidth(kept, measure) <= measure.available) {
    return [];
  }
  const folded: string[] = [];
  while (kept.length > 0) {
    const next = kept.shift() as Foldable;
    folded.push(next.id);
    const row = rowWidth(kept, measure) + measure.gap + measure.control;
    if (row <= measure.available) {
      break;
    }
  }
  return folded;
}

export function sameIds(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

function rowWidth(items: readonly Foldable[], measure: FoldMeasure): number {
  if (items.length === 0) {
    return 0;
  }
  const widths = items.reduce(
    (sum, item) => sum + (measure.widthOf(item.id) ?? 0),
    0,
  );
  return widths + measure.gap * (items.length - 1);
}

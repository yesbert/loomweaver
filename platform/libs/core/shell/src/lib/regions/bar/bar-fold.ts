import { BarItem, BarSlot } from '../../foundation/bar-item';

const FOLD_SLOTS: readonly BarSlot[] = ['end', 'center', 'start'];

export interface FoldMeasure {
  readonly available: number;
  readonly control: number;
  readonly gap: number;
  readonly widthOf: (id: string) => number | undefined;
}

export function foldRank(items: readonly BarItem[]): readonly BarItem[] {
  return FOLD_SLOTS.flatMap((slot) =>
    items
      .filter((item) => item.slot === slot)
      .toReversed()
      .toSorted((a, b) => (b.order ?? 0) - (a.order ?? 0)),
  );
}

export function foldedIds(
  rank: readonly BarItem[],
  measure: FoldMeasure,
): readonly string[] {
  const kept = [...rank];
  if (rowWidth(kept, measure) <= measure.available) {
    return [];
  }
  const folded: string[] = [];
  while (kept.length > 0) {
    const next = kept.shift() as BarItem;
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

function rowWidth(items: readonly BarItem[], measure: FoldMeasure): number {
  if (items.length === 0) {
    return 0;
  }
  const widths = items.reduce(
    (sum, item) => sum + (measure.widthOf(item.id) ?? 0),
    0,
  );
  return widths + measure.gap * (items.length - 1);
}

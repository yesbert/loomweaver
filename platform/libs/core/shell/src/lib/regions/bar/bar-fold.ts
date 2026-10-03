import { BarItem, BarSlot } from '../../foundation/bar-item';

export { foldedIds, sameIds, type FoldMeasure } from '../../elements/row-fold';

const FOLD_SLOTS: readonly BarSlot[] = ['end', 'center', 'start'];

export function foldRank(items: readonly BarItem[]): readonly BarItem[] {
  return FOLD_SLOTS.flatMap((slot) =>
    items
      .filter((item) => item.slot === slot)
      .toReversed()
      .toSorted((a, b) => (b.order ?? 0) - (a.order ?? 0)),
  );
}

import { RailItem } from '../../foundation/rail-item';

export type RailBand = 'top' | 'bottom';

export interface RailEntries {
  readonly top: readonly RailItem[];
  readonly bottom: readonly RailItem[];
}

export function bandOf(item: RailItem): RailBand {
  return item.anchor ?? 'top';
}

export function railEntries(
  shown: readonly RailItem[],
  inUserOrder: (band: readonly RailItem[]) => readonly RailItem[],
): RailEntries {
  const declared = shown.toSorted((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const inBand = (band: RailBand) =>
    inUserOrder(declared.filter((item) => bandOf(item) === band));
  return { top: inBand('top'), bottom: inBand('bottom') };
}

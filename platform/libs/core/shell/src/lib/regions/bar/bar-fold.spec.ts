import { BarItem } from '../../foundation/bar-item';
import { foldedIds, foldRank, sameIds } from './bar-fold';

const STATUS_BAR: readonly BarItem[] = [
  { id: 'search', bar: 'status-bar', slot: 'start', order: 10, command: 'x' },
  { id: 'look', bar: 'status-bar', slot: 'end', order: 80, command: 'x' },
  { id: 'update', bar: 'status-bar', slot: 'end', order: 90, command: 'x' },
  { id: 'preview', bar: 'status-bar', slot: 'end', order: 95, command: 'x' },
  { id: 'version', bar: 'status-bar', slot: 'end', order: 100, command: 'x' },
  { id: 'legal', bar: 'status-bar', slot: 'end', order: 100, command: 'x' },
];

function measure(available: number, widths: Record<string, number>) {
  return {
    available,
    control: 28,
    gap: 8,
    widthOf: (id: string) => widths[id],
  };
}

const SIXTY_EACH = Object.fromEntries(STATUS_BAR.map((item) => [item.id, 60]));

describe('foldRank', () => {
  it('folds the end slot from its highest order down, the later of equals first, then the centre, then the start', () => {
    expect(foldRank(STATUS_BAR).map((item) => item.id)).toEqual([
      'legal',
      'version',
      'preview',
      'update',
      'look',
      'search',
    ]);
  });
});

describe('foldedIds', () => {
  it('folds nothing when every entry fits', () => {
    expect(foldedIds(foldRank(STATUS_BAR), measure(1000, SIXTY_EACH))).toEqual(
      [],
    );
  });

  it('folds the last entry first, and only as many as it takes to fit beside the control', () => {
    const rank = foldRank(STATUS_BAR);

    const fitsAll = 6 * 60 + 5 * 8;
    const fitsFiveAndControl = 5 * 60 + 4 * 8 + 8 + 28;

    expect(foldedIds(rank, measure(fitsAll - 1, SIXTY_EACH))).toEqual([
      'legal',
    ]);
    expect(
      foldedIds(rank, measure(fitsFiveAndControl - 1, SIXTY_EACH)),
    ).toEqual(['legal', 'version']);
  });

  it('returns a folded entry once the width allows it', () => {
    const rank = foldRank(STATUS_BAR);
    const narrow = foldedIds(rank, measure(300, SIXTY_EACH));
    const wide = foldedIds(rank, measure(1000, SIXTY_EACH));

    expect(narrow.length).toBeGreaterThan(0);
    expect(wide).toEqual([]);
  });

  it('settles across one entry threshold, the same answer for the same width', () => {
    const rank = foldRank(STATUS_BAR);
    const fitsAll = 6 * 60 + 5 * 8;
    const oneShort = fitsAll - 1;

    const first = foldedIds(rank, measure(oneShort, SIXTY_EACH));
    const again = foldedIds(rank, measure(oneShort, SIXTY_EACH));
    const back = foldedIds(rank, measure(fitsAll, SIXTY_EACH));

    expect(sameIds(first, again)).toBe(true);
    expect(back).toEqual([]);
  });

  it('treats an entry never measured as taking no room, so it is shown and measured', () => {
    const rank = foldRank(STATUS_BAR);

    expect(foldedIds(rank, measure(100, {}))).toEqual([]);
  });
});

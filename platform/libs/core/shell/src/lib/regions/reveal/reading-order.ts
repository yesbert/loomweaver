import { DockPosition, ShellLayout } from '../../layout/layout';
import { CONTENT_DOCK, PaneRef } from '../pane/tree/pane-address';

const POSITIONS: readonly DockPosition[] = [
  'top',
  'left',
  'center',
  'right',
  'bottom',
];

type Rank = readonly [position: number, declared: number];

function dockRank(layout: ShellLayout, dock: string): Rank {
  const declared = layout.regions.findIndex((region) =>
    dock === CONTENT_DOCK ? region.type === 'content' : region.id === dock,
  );
  return declared === -1
    ? [POSITIONS.length, 0]
    : [POSITIONS.indexOf(layout.regions[declared].dock), declared];
}

export function inReadingOrder<T extends PaneRef>(
  layout: ShellLayout,
  panes: readonly T[],
): T[] {
  return panes.toSorted((a, b) => {
    const [positionA, declaredA] = dockRank(layout, a.dock);
    const [positionB, declaredB] = dockRank(layout, b.dock);
    return positionA - positionB || declaredA - declaredB;
  });
}

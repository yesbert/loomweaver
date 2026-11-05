import { LayoutRegion } from '../../layout/layout';

export const HIDDEN = 'hidden';

export interface CurationRow {
  readonly id: string;
  readonly label: string;
  readonly icon?: string;
  readonly initials?: string;
  readonly place: string;
  readonly home: string;
}

export interface CurationSource {
  regions(): LayoutRegion[];
  rows(): CurationRow[];
  place(row: CurationRow, place: string): void;
  offersHiding(): boolean;
  offersMoving(): boolean;
}

export function placeOffered(
  source: Pick<CurationSource, 'offersHiding' | 'offersMoving'>,
  row: CurationRow,
  place: string,
): boolean {
  if (place === row.place) {
    return true;
  }
  if (place === HIDDEN) {
    return source.offersHiding();
  }
  return source.offersMoving() || (row.place === HIDDEN && place === row.home);
}

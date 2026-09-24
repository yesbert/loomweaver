import { LayoutRegion } from '../../layout/layout';

export const HIDDEN = 'hidden';

export interface CurationRow {
  readonly id: string;
  readonly label: string;
  readonly icon?: string;
  readonly initials?: string;
  readonly place: string;
}

export interface CurationSource {
  regions(): LayoutRegion[];
  rows(): CurationRow[];
  place(row: CurationRow, place: string): void;
}

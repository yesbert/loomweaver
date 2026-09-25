import { QuickOpenTarget } from '../../regions/content/tabs/quick-open-target';
import { ranked } from './palette-fuzzy';
import { formatRelativeTime } from './relative-time';

export interface TabRow {
  readonly kind: 'tab';
  readonly id: string;
  readonly label: string;
  readonly icon?: string;
  readonly navPath: string;
  readonly pinned: boolean;
  readonly closable: boolean;
  readonly lastActive?: number;
  readonly time?: string;
}

export function tabRows(
  targets: readonly QuickOpenTarget[],
  translate: (key: string) => string,
  locale: string,
  now: number,
): readonly TabRow[] {
  return targets.map((tab) => ({
    kind: 'tab',
    id: tab.path,
    label: tab.literalTitle ? tab.title : translate(tab.title),
    icon: tab.icon,
    navPath: tab.navPath,
    pinned: tab.pinned,
    closable: tab.closable,
    lastActive: tab.lastActive,
    time:
      tab.lastActive === undefined
        ? undefined
        : formatRelativeTime(locale, tab.lastActive, now),
  }));
}

export function tabResults(
  rows: readonly TabRow[],
  query: string,
): readonly TabRow[] {
  if (!query) {
    return rows.toSorted((a, b) => (b.lastActive ?? 0) - (a.lastActive ?? 0));
  }
  return ranked(query, rows);
}

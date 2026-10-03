import { ResolvedEntry } from '../../menu/menu-resolution';
import { matching, ranked } from './palette-fuzzy';

export interface CommandRow {
  readonly kind: 'command';
  readonly id: string;
  readonly label: string;
  readonly icon?: string;
  readonly shortcut?: string;
}

export interface CommandSections {
  readonly recent: readonly CommandRow[];
  readonly others: readonly CommandRow[];
}

export function commandRows(
  entries: readonly ResolvedEntry[],
  translate: (key: string) => string,
): readonly CommandRow[] {
  return entries.flatMap((entry) =>
    entry.command === undefined
      ? []
      : [
          {
            kind: 'command' as const,
            id: entry.command.id,
            label: translate(entry.command.title),
            icon: entry.icon,
            shortcut: entry.shortcut,
          },
        ],
  );
}

export function commandSections(
  rows: readonly CommandRow[],
  recentIds: readonly string[],
  query: string,
): CommandSections {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const recent = recentIds
    .map((id) => byId.get(id))
    .filter((row): row is CommandRow => row !== undefined);
  const recentSet = new Set(recent.map((row) => row.id));
  const others = rows.filter((row) => !recentSet.has(row.id));
  if (!query) {
    return { recent, others };
  }
  return { recent: matching(query, recent), others: ranked(query, others) };
}

import { Command } from '@loomweaver/plugin-sdk';
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

export interface CommandWording {
  readonly translate: (key: string) => string;
  readonly shortcutOf: (command: Command) => string | undefined;
}

export function commandRows(
  commands: readonly Command[],
  wording: CommandWording,
): readonly CommandRow[] {
  return commands.map((command) => ({
    kind: 'command',
    id: command.id,
    label: wording.translate(command.title),
    icon: command.icon,
    shortcut: wording.shortcutOf(command),
  }));
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

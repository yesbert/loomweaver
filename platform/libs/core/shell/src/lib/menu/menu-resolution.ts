import {
  Command,
  MenuContext,
  MenuHeader,
  MenuItem,
} from '@loomweaver/plugin-sdk';

export interface ResolvedItem {
  readonly key: string;
  readonly title: string;
  readonly group: string;
  readonly order: number;
  readonly icon?: string;
  readonly shortcut?: string;
  readonly checkbox: boolean;
  readonly checked: boolean;
  readonly item: MenuItem;
}

export interface MenuSources {
  readonly menuItems: readonly MenuItem[];
  readonly commands: readonly Command[];
  readonly shortcutOf: (command: Command | undefined) => string | undefined;
}

export function resolveMenuItems(
  menuIds: readonly string[],
  context: MenuContext,
  sources: MenuSources,
): ResolvedItem[] {
  return sources.menuItems
    .filter(
      (item) => menuIds.includes(item.menu) && whenMatches(item.when, context),
    )
    .map((item, index) => resolveItem(item, index, context, sources))
    .filter((entry): entry is ResolvedItem => entry !== null)
    .toSorted((a, b) => a.group.localeCompare(b.group) || a.order - b.order);
}

function resolveItem(
  item: MenuItem,
  index: number,
  context: MenuContext,
  sources: MenuSources,
): ResolvedItem | null {
  const command = item.command
    ? sources.commands.find((candidate) => candidate.id === item.command)
    : undefined;
  if (item.command && !command) {
    return null;
  }
  const title = item.title ?? command?.title;
  if (title === undefined) {
    return null;
  }
  const checkbox = item.checkedWhen !== undefined;
  return {
    key: item.command ?? `__inline-${index}`,
    title,
    group: item.group ?? '',
    order: item.order ?? 0,
    icon: command?.icon,
    shortcut: sources.shortcutOf(command),
    checkbox,
    checked: checkbox && whenMatches(item.checkedWhen, context),
    item,
  };
}

export function headingCommand(
  header: MenuHeader | undefined,
  commands: readonly Command[],
): Command | undefined {
  if (!header?.command) {
    return undefined;
  }
  const command = commands.find((candidate) => candidate.id === header.command);
  return command?.title ? command : undefined;
}

export function whenMatches(
  when: MenuContext | undefined,
  context: MenuContext,
): boolean {
  if (!when) {
    return true;
  }
  return Object.entries(when).every(([key, value]) => context[key] === value);
}

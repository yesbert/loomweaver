import {
  AccessRequirement,
  Command,
  MenuContext,
  MenuHeader,
  MenuTrigger,
} from '@loomweaver/plugin-sdk';

export interface SlotEntry {
  readonly id?: string;
  readonly command?: string;
  run?(context?: MenuContext): unknown;
  readonly title?: string;
  readonly icon?: string;
  readonly pressed?: boolean;
  readonly access?: AccessRequirement;
  readonly group?: string;
  readonly order?: number;
  readonly when?: MenuContext;
  readonly checkedWhen?: MenuContext;
  readonly menu?: string;
  readonly menuTrigger?: MenuTrigger;
  readonly submenu?: string;
  readonly menuHeader?: MenuHeader;
  readonly workspace?: string;
}

export interface ResolvedEntry<T extends SlotEntry = SlotEntry> {
  readonly key: string;
  readonly title?: string;
  readonly group: string;
  readonly order: number;
  readonly icon?: string;
  readonly shortcut?: string;
  readonly checkbox: boolean;
  readonly checked: boolean;
  readonly pressed?: boolean;
  readonly disabled: boolean;
  readonly opensMenu?: string;
  readonly command?: Command;
  readonly item: T;
}

export interface SlotSources {
  readonly commands: readonly Command[];
  readonly available: (command: Command) => boolean;
  readonly shortcutOf: (command: Command | undefined) => string | undefined;
  readonly visible: (access: AccessRequirement | undefined) => boolean;
  readonly disabled: (access: AccessRequirement | undefined) => boolean;
  readonly menuOffered?: (
    entry: SlotEntry,
    context: MenuContext,
  ) => string | undefined;
}

export interface SlotSourceServices {
  readonly registry: { readonly commands: () => readonly Command[] };
  readonly commands: {
    available(command: Command): boolean;
    shortcutOf(command: Command | undefined): string | undefined;
  };
  readonly auth: {
    visible(access: AccessRequirement | undefined): boolean;
    disabled(access: AccessRequirement | undefined): boolean;
  };
}

export function slotSources(
  { registry, commands, auth }: SlotSourceServices,
  menuOffered?: SlotSources['menuOffered'],
): SlotSources {
  return {
    commands: registry.commands(),
    available: (command) => commands.available(command),
    shortcutOf: (command) => commands.shortcutOf(command),
    visible: (access) => auth.visible(access),
    disabled: (access) => auth.disabled(access),
    menuOffered,
  };
}

export function resolveSlot<T extends SlotEntry>(
  entries: readonly T[],
  contextOf: (entry: T) => MenuContext,
  sources: SlotSources,
): ResolvedEntry<T>[] {
  return entries
    .map((entry, index) =>
      resolveEntry(entry, index, contextOf(entry), sources),
    )
    .filter((entry): entry is ResolvedEntry<T> => entry !== null)
    .toSorted((a, b) => a.group.localeCompare(b.group) || a.order - b.order);
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

function resolveEntry<T extends SlotEntry>(
  entry: T,
  index: number,
  context: MenuContext,
  sources: SlotSources,
): ResolvedEntry<T> | null {
  if (!whenMatches(entry.when, context) || !sources.visible(entry.access)) {
    return null;
  }
  const command = commandOf(entry, sources);
  if (entry.command && !command) {
    return null;
  }
  const opensMenu = sources.menuOffered?.(entry, context);
  if (!leadsSomewhere(entry, command, opensMenu)) {
    return null;
  }
  const checkbox = entry.checkedWhen !== undefined;
  return {
    key: entry.command ?? entry.id ?? `__inline-${index}`,
    title: entry.title ?? command?.title,
    group: entry.group ?? '',
    order: entry.order ?? 0,
    icon: entry.icon ?? command?.icon,
    shortcut: sources.shortcutOf(command),
    checkbox,
    checked: checkbox && whenMatches(entry.checkedWhen, context),
    pressed: entry.pressed ?? (checkbox ? whenMatches(entry.checkedWhen, context) : undefined),
    disabled: sources.disabled(entry.access),
    opensMenu,
    command,
    item: entry,
  };
}

function commandOf(
  entry: SlotEntry,
  sources: SlotSources,
): Command | undefined {
  if (!entry.command) {
    return undefined;
  }
  const command = sources.commands.find(
    (candidate) => candidate.id === entry.command,
  );
  return command && sources.available(command) ? command : undefined;
}

function leadsSomewhere(
  entry: SlotEntry,
  command: Command | undefined,
  opensMenu: string | undefined,
): boolean {
  return (
    command !== undefined ||
    entry.run !== undefined ||
    opensMenu !== undefined ||
    entry.workspace !== undefined
  );
}

import { Command, MenuItem, SettingsSection } from '@loomweaver/plugin-sdk';
import { chordClaims } from '../commands/keyboard/chord';
import { RegionType, ShellLayout } from '../layout/layout';
import { regionById } from '../layout/layout-queries';
import { menuEntryId } from '../menu/menu-entry-id';
import { ROUTE_OMIT_PREFIX } from '../contributions/route-omit';
import { SETTING_OMIT_PREFIX } from '../settings-dialog/setting-omit';

export interface Placement {
  readonly id: string;
  readonly region: string;
  readonly expected: RegionType;
}

export interface OmitTargets {
  readonly settingIds: ReadonlySet<string>;
  readonly routeIds: ReadonlySet<string>;
  readonly registeredIds: ReadonlySet<string>;
}

export interface CommandReference {
  readonly command: string | undefined;
  readonly what: string;
}

export function misplacedContributions(
  layout: ShellLayout,
  placements: readonly Placement[],
): string[] {
  return placements.flatMap((placement) => {
    const problem = misplacement(layout, placement);
    return problem === undefined ? [] : [problem];
  });
}

export function uncomposedRequirements(
  required: readonly string[],
  composed: ReadonlySet<string>,
): string[] {
  const missing = required.filter((id) => !composed.has(id));
  return missing.length === 0
    ? []
    : [
        `Composition: provideRequiredPlugins names ${missing.join(', ')}, which this ` +
          'distribution does not compose, so the declaration is ignored.',
      ];
}

export function unmatchedOmits(
  omitted: Iterable<string>,
  targets: OmitTargets,
): string[] {
  return [...omitted]
    .filter((id) => !omitMatches(id, targets))
    .map(
      (id) =>
        `Composition: omit '${id}' matched nothing, so it hides nothing.${omitHint(id, targets)}`,
    );
}

export function unmatchedRowReplacements(
  sections: readonly SettingsSection[],
  replacedRowIds: readonly string[],
): string[] {
  const rowIds = new Set(
    sections.flatMap((section) => section.rows.map((row) => row.id)),
  );
  return replacedRowIds
    .filter((id) => !rowIds.has(id))
    .map(
      (id) =>
        `Composition: row replacement '${id}' matched no row, so it replaces nothing.`,
    );
}

export function danglingCommands(
  registered: ReadonlySet<string>,
  references: readonly CommandReference[],
): string[] {
  return references
    .filter(({ command }) => command !== undefined && !registered.has(command))
    .map(
      ({ command, what }) =>
        `Composition: ${what} points at command '${command}', which no one registers (or which an ` +
        `omit removed). The shell drops it rather than drawing a dead control.`,
    );
}

export function contestedShortcuts(
  commands: readonly Command[],
  isMac: boolean,
): string[] {
  return [...chordClaims(commands, isMac).bySignature.values()]
    .filter((claimants) => claimants.length > 1)
    .map((claimants) => contestedShortcut(claimants));
}

export function settingIds(
  sections: readonly SettingsSection[],
): ReadonlySet<string> {
  const ids = new Set<string>();
  for (const section of sections) {
    ids.add(section.id);
    for (const row of section.rows) {
      ids.add(row.id);
    }
  }
  return ids;
}

export function menuLabel(item: MenuItem): string {
  return item.id === undefined
    ? `menu entry in '${item.menu}'`
    : `menu entry "${item.id}"`;
}

function misplacement(
  layout: ShellLayout,
  { id, region: regionId, expected }: Placement,
): string | undefined {
  const region = regionById(layout, regionId);
  if (region?.type === expected) {
    return undefined;
  }
  const detail = region
    ? `a '${region.type}' region`
    : 'a region this layout does not declare';
  const alternatives = layout.regions
    .filter((entry) => entry.type === expected)
    .map((entry) => entry.id);
  const hint = alternatives.length
    ? ` Declared '${expected}' regions: ${alternatives.join(', ')}.`
    : ` This layout declares no '${expected}' region at all.`;
  return (
    `Composition: "${id}" is contributed to '${regionId}' — ${detail}. ` +
    `A '${expected}' contribution renders only in a '${expected}' region, so it will not ` +
    `appear.${hint}`
  );
}

function omitMatches(id: string, targets: OmitTargets): boolean {
  if (id.startsWith(SETTING_OMIT_PREFIX)) {
    return targets.settingIds.has(id.slice(SETTING_OMIT_PREFIX.length));
  }
  if (id.startsWith(ROUTE_OMIT_PREFIX)) {
    return targets.routeIds.has(id.slice(ROUTE_OMIT_PREFIX.length));
  }
  return targets.registeredIds.has(id);
}

function omitHint(id: string, targets: OmitTargets): string {
  if (id.includes(':')) {
    return '';
  }
  if (targets.settingIds.has(id)) {
    return ` A settings section or row carries that id — did you mean '${SETTING_OMIT_PREFIX}${id}'?`;
  }
  if (targets.routeIds.has(id)) {
    return ` A routable surface carries that id — did you mean '${ROUTE_OMIT_PREFIX}${id}'?`;
  }
  if (targets.registeredIds.has(menuEntryId(id))) {
    return ` A menu entry carries that id — did you mean '${menuEntryId(id)}'?`;
  }
  return '';
}

function contestedShortcut(contesting: readonly Command[]): string {
  const holder = contesting.at(-1) as Command;
  const named = contesting.map((command) => `'${command.id}'`).join(', ');
  return (
    `Composition: the shortcut '${holder.shortcut}' is claimed by ${named}. It runs ` +
    `'${holder.id}', the last to register it, so a control still offering that shortcut for any ` +
    `of the others promises something it no longer does.`
  );
}

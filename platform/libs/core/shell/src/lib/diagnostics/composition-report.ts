import { inject, Service } from '@angular/core';
import { MenuItem, SettingsSection } from '@loomweaver/plugin-sdk';
import { BAR_ITEM } from '../foundation/bar-item';
import { RAIL_ITEM } from '../foundation/rail-item';
import { VIEW } from '../layout/view';
import { ContributionRegistry } from '../plugin/contribution-registry';
import { RegionType, SHELL_LAYOUT } from '../layout/layout';
import { ROUTE_OMIT_PREFIX } from '../plugin/route-omit';
import { SETTING_OMIT_PREFIX } from '../settings/setting-omit';
import { SettingsService } from '../settings/settings.service';
import { DEFAULT_SHELL_FEATURES, SHELL_FEATURES } from '../foundation/shell-features';
import { VersionService } from '../version/version.service';

@Service()
export class CompositionReport {
  private readonly registry = inject(ContributionRegistry);
  private readonly settings = inject(SettingsService);
  private readonly layout = inject(SHELL_LAYOUT);
  private readonly features = inject(SHELL_FEATURES);
  private readonly barItems = inject(BAR_ITEM, { optional: true }) ?? [];
  private readonly railItems = inject(RAIL_ITEM, { optional: true }) ?? [];
  private readonly views = inject(VIEW, { optional: true }) ?? [];
  private readonly versions = inject(VersionService);

  checkStaticContributions(): void {
    for (const problem of this.staticProblems()) {
      console.warn(problem);
    }
  }

  print(): void {
    const lines = [
      `Version: ${this.versions.version()}${this.versions.isPreview() ? ' (preview)' : ''}`,
      `Layout: ${this.layout.regions
        .map((region) => `${region.id} (${region.type}/${region.dock})`)
        .join(', ')}`,
      `Capabilities off: ${this.disabledFeatures().join(', ') || 'none'}`,
      `Omitted: ${[...this.registry.omitted()].join(', ') || 'none'}`,
    ];
    const problems = [...this.staticProblems(), ...this.problems()];
    console.info(
      ['LoomWeaver composition', ...lines.map((line) => `  ${line}`)].join(
        '\n',
      ),
    );
    if (problems.length === 0) {
      console.info('  No problems found.');
      return;
    }
    for (const problem of problems) {
      console.warn(problem);
    }
  }

  private disabledFeatures(): string[] {
    const off: string[] = [];
    for (const group of Object.keys(
      DEFAULT_SHELL_FEATURES,
    ) as (keyof typeof DEFAULT_SHELL_FEATURES)[]) {
      const flags = this.features[group] as unknown as Readonly<
        Record<string, boolean>
      >;
      for (const [name, enabled] of Object.entries(flags)) {
        if (!enabled) {
          off.push(`${group}.${name}`);
        }
      }
    }
    return off;
  }

  private staticProblems(): string[] {
    const problems: string[] = [];
    for (const item of this.barItems) {
      this.pushUnlessRegion(problems, item.id, item.bar, 'bar');
    }
    for (const item of this.railItems) {
      this.pushUnlessRegion(problems, item.id, item.rail, 'rail');
    }
    for (const view of this.views) {
      this.pushUnlessRegion(problems, view.id, view.region, 'panel');
    }
    return problems;
  }

  private pushUnlessRegion(
    problems: string[],
    itemId: string,
    regionId: string,
    expected: RegionType,
  ): void {
    const region = this.layout.regions.find((entry) => entry.id === regionId);
    if (region?.type === expected) {
      return;
    }
    const detail = region
      ? `a '${region.type}' region`
      : 'a region this layout does not declare';
    const alternatives = this.layout.regions
      .filter((entry) => entry.type === expected)
      .map((entry) => entry.id);
    const hint = alternatives.length
      ? ` Declared '${expected}' regions: ${alternatives.join(', ')}.`
      : ` This layout declares no '${expected}' region at all.`;
    problems.push(
      `Composition: "${itemId}" is contributed to '${regionId}' — ${detail}. ` +
        `A '${expected}' contribution renders only in a '${expected}' region, so it will not ` +
        `appear.${hint}`,
    );
  }

  private problems(): string[] {
    return [...this.unmatchedOmits(), ...this.danglingCommands()];
  }

  private unmatchedOmits(): string[] {
    const problems: string[] = [];
    for (const id of this.registry.omitted()) {
      if (this.omitMatches(id)) {
        continue;
      }
      problems.push(
        `Composition: omit '${id}' matched nothing, so it hides nothing.${this.omitHint(id)}`,
      );
    }
    return problems;
  }

  private omitMatches(id: string): boolean {
    if (id.startsWith(SETTING_OMIT_PREFIX)) {
      return this.settingIds().has(id.slice(SETTING_OMIT_PREFIX.length));
    }
    if (id.startsWith(ROUTE_OMIT_PREFIX)) {
      return this.routeIds().has(id.slice(ROUTE_OMIT_PREFIX.length));
    }
    return this.registry.registeredIds().has(id);
  }

  private omitHint(id: string): string {
    if (id.includes(':')) {
      return '';
    }
    if (this.settingIds().has(id)) {
      return ` A settings section or row carries that id — did you mean '${SETTING_OMIT_PREFIX}${id}'?`;
    }
    if (this.routeIds().has(id)) {
      return ` A routable surface carries that id — did you mean '${ROUTE_OMIT_PREFIX}${id}'?`;
    }
    if (this.registry.registeredIds().has(`menu:${id}`)) {
      return ` A menu entry carries that id — did you mean 'menu:${id}'?`;
    }
    return '';
  }

  private danglingCommands(): string[] {
    const commands = new Set(
      this.registry.commands().map((command) => command.id),
    );
    const problems: string[] = [];
    for (const item of this.registry.menuItems()) {
      this.pushUnlessCommand(problems, commands, item.command, menuLabel(item));
    }
    for (const item of this.registry.barItems()) {
      if ('command' in item) {
        this.pushUnlessCommand(
          problems,
          commands,
          item.command,
          `bar item "${item.id}"`,
        );
      }
    }
    for (const item of this.registry.railItems()) {
      this.pushUnlessCommand(
        problems,
        commands,
        item.command,
        `rail item "${item.id}"`,
      );
    }
    for (const view of this.registry.views()) {
      for (const action of view.actions ?? []) {
        this.pushUnlessCommand(
          problems,
          commands,
          action.command,
          `view action "${action.id}"`,
        );
      }
    }
    for (const section of this.settings.registered()) {
      for (const row of section.rows) {
        if (row.control.kind === 'button') {
          this.pushUnlessCommand(
            problems,
            commands,
            row.control.command,
            `settings row "${row.id}"`,
          );
        }
      }
    }
    return problems;
  }

  private pushUnlessCommand(
    problems: string[],
    commands: ReadonlySet<string>,
    command: string | undefined,
    what: string,
  ): void {
    if (command === undefined || commands.has(command)) {
      return;
    }
    problems.push(
      `Composition: ${what} points at command '${command}', which no one registers (or which an ` +
        `omit removed). The shell drops it rather than drawing a dead control.`,
    );
  }

  private settingIds(): ReadonlySet<string> {
    return idsOf(this.settings.registered());
  }

  private routeIds(): ReadonlySet<string> {
    const ids = new Set<string>();
    for (const route of [
      ...this.registry.contentRoutes(),
      ...this.registry.omittedContentRoutes(),
    ]) {
      if (route.id !== undefined) {
        ids.add(route.id);
      }
    }
    return ids;
  }
}

export function installCompositionReport(report: CompositionReport): void {
  if (globalThis.window === undefined) {
    return;
  }
  const host = globalThis as unknown as Record<string, unknown>;
  if (host['loomweaver'] !== undefined) {
    return;
  }
  host['loomweaver'] = { report: () => report.print() };
  console.info(
    'LoomWeaver: call loomweaver.report() for this product’s composition.',
  );
}

function idsOf(sections: readonly SettingsSection[]): ReadonlySet<string> {
  const ids = new Set<string>();
  for (const section of sections) {
    ids.add(section.id);
    for (const row of section.rows) {
      ids.add(row.id);
    }
  }
  return ids;
}

function menuLabel(item: MenuItem): string {
  return item.id === undefined
    ? `menu entry in '${item.menu}'`
    : `menu entry "${item.id}"`;
}

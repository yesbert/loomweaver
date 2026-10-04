import { inject, Service } from '@angular/core';
import { ViewAction } from '@loomweaver/plugin-sdk';
import { ActivationSettled } from '../plugin/activation-settled';
import { BAR_ITEM } from '../foundation/bar-item';
import { RAIL_ITEM } from '../foundation/rail-item';
import { VIEW } from '../views/view';
import { isMacPlatform } from '../commands/keyboard/chord';
import { ContributionRegistry } from '../contributions/contribution-registry';
import { SHELL_LAYOUT } from '../layout/layout';
import { SettingsService } from '../settings-dialog/settings.service';
import {
  DEFAULT_SHELL_FEATURES,
  SHELL_FEATURES,
} from '../foundation/shell-features';
import { VersionService } from '../version/version.service';
import { REQUIRED_PLUGINS } from '../foundation/required-plugins';
import { PLUGIN } from '../plugin/plugin';
import { FRAME_PLUGIN } from '../plugin/frame/frame-plugin';
import {
  CommandReference,
  contestedShortcuts,
  danglingCommands,
  menuLabel,
  misplacedContributions,
  OmitTargets,
  Placement,
  settingIds,
  uncomposedRequirements,
  undeclaredSlots,
  unmatchedOmits,
  unmatchedRowReplacements,
} from './composition-checks';
import { declaredSlots } from './declared-slots';
import { isBarButton } from '../regions/bar/bar-context';
import {
  surfaceActionsSlot,
  ToolbarRegistry,
} from '../contributions/toolbar-registry';

const SLOT_REPORT_QUIET_MS = 1000;

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
  private readonly required = inject(REQUIRED_PLUGINS);
  private readonly plugins = inject(PLUGIN, { optional: true }) ?? [];
  private readonly framePlugins =
    inject(FRAME_PLUGIN, { optional: true }) ?? [];
  private readonly activation = inject(ActivationSettled);
  private readonly toolbars = inject(ToolbarRegistry);

  checkStaticContributions(): void {
    for (const problem of this.staticProblems()) {
      console.warn(problem);
    }
  }

  async reportUndeclaredSlotsOnceSettled(): Promise<void> {
    do {
      await this.activation.settled();
      await new Promise((resolve) =>
        setTimeout(resolve, SLOT_REPORT_QUIET_MS),
      );
    } while (this.activation.isPending());
    for (const problem of this.undeclaredSlotProblems()) {
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
    const problems = [...this.staticProblems(), ...this.registryProblems()];
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
    return [
      ...misplacedContributions(this.layout, this.placements()),
      ...uncomposedRequirements(this.required, this.composedPluginIds()),
    ];
  }

  private registryProblems(): string[] {
    return [
      ...unmatchedOmits(this.registry.omitted(), this.omitTargets()),
      ...unmatchedRowReplacements(
        this.settings.registered(),
        this.settings.replacedRowIds(),
      ),
      ...danglingCommands(
        new Set(this.registry.commands().map((command) => command.id)),
        this.commandReferences(),
      ),
      ...contestedShortcuts(this.registry.commands(), isMacPlatform()),
      ...this.undeclaredSlotProblems(),
    ];
  }

  private undeclaredSlotProblems(): string[] {
    return undeclaredSlots(
      this.registry.registeredMenuItems(),
      declaredSlots([
        ...this.registry.railItems(),
        ...this.registry.barItems().filter((item) => isBarButton(item)),
        ...this.surfaceActions().map(({ action }) => action),
        ...this.toolbars
          .toolbars()
          .map((entry) => ({ menu: entry.toolbar.slot })),
        ...this.surfaceIds().map((id) => ({ menu: surfaceActionsSlot(id) })),
        ...this.registry.menuItems().map((item) => ({ menu: item.submenu })),
      ]),
    );
  }

  private placements(): Placement[] {
    return [
      ...this.barItems.map((item) => ({
        id: item.id,
        region: item.bar,
        expected: 'bar' as const,
      })),
      ...this.railItems.map((item) => ({
        id: item.id,
        region: item.rail,
        expected: 'rail' as const,
      })),
      ...this.views.map((view) => ({
        id: view.id,
        region: view.region,
        expected: 'panel' as const,
      })),
    ];
  }

  private composedPluginIds(): ReadonlySet<string> {
    return new Set([
      ...this.plugins.map((plugin) => plugin.manifest.id),
      ...this.framePlugins.map((plugin) => plugin.id),
    ]);
  }

  private omitTargets(): OmitTargets {
    return {
      settingIds: settingIds(this.settings.registered()),
      routeIds: this.routeIds(),
      registeredIds: this.registry.registeredIds(),
    };
  }

  private commandReferences(): CommandReference[] {
    return [
      ...this.registry.menuItems().map((item) => ({
        command: item.command,
        what: menuLabel(item),
      })),
      ...this.registry
        .barItems()
        .flatMap((item) =>
          'command' in item
            ? [{ command: item.command, what: `bar item "${item.id}"` }]
            : [],
        ),
      ...this.registry.railItems().map((item) => ({
        command: item.command,
        what: `rail item "${item.id}"`,
      })),
      ...this.surfaceActions().map(({ surface, action }) => ({
        command: action.command,
        what: `action "${action.id}" of surface "${surface}"`,
      })),
      ...this.settings
        .registered()
        .flatMap((section) =>
          section.rows.flatMap((row) =>
            row.control.kind === 'button'
              ? [
                  {
                    command: row.control.command,
                    what: `settings row "${row.id}"`,
                  },
                ]
              : [],
          ),
        ),
    ];
  }

  private surfaceActions(): { surface: string; action: ViewAction }[] {
    const seen = new Set<string>();
    return [...this.registry.views(), ...this.registry.contentRoutes()].flatMap(
      (surface) => {
        const id = surface.id ?? '';
        if (seen.has(id) && id !== '') {
          return [];
        }
        seen.add(id);
        return (surface.actions ?? []).map((action) => ({ surface: id, action }));
      },
    );
  }

  private surfaceIds(): string[] {
    return [...this.registry.views(), ...this.registry.contentRoutes()].flatMap(
      (surface) => (surface.id === undefined ? [] : [surface.id]),
    );
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

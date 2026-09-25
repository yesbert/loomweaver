import { inject, isDevMode, Service } from '@angular/core';
import { ContributionRegistry } from '../contributions/contribution-registry';
import { SHELL_LAYOUT } from '../layout/layout';
import { regionIdsOfType } from '../layout/layout-queries';
import { WORKING_STATE_STORE } from '../persistence/working-state-store';
import { activeContentPath } from '../regions/pane/tree/active-content-path';
import { PaneTreeService } from '../regions/pane/tree/pane-tree.service';
import { HiddenViewsService } from '../regions/panel/hidden-views.service';
import { PanelGroupService } from '../regions/panel/panel-group.service';
import { ActiveWorkspaceService } from './active-workspace.service';
import { WORKSPACE_STATE_KEYS, stateChannels } from './baseline/state-channels';
import { readWorkspaceState } from './baseline/workspace-state';
import { WorkspaceCatalog } from './catalog/workspace-catalog';
import { warnDeclarationGaps } from './declaration/definition-audit';
import {
  PanelDeclarations,
  definitionBaseline,
} from './declaration/definition-baseline';
import { AddressSettlement } from './settlement/address-settlement';

@Service()
export class WorkspaceSwitcher {
  private readonly active = inject(ActiveWorkspaceService);
  private readonly catalog = inject(WorkspaceCatalog);
  private readonly settlement = inject(AddressSettlement);
  private readonly workingStateStore = inject(WORKING_STATE_STORE);
  private readonly paneTree = inject(PaneTreeService);
  private readonly panelGroups = inject(PanelGroupService);
  private readonly registry = inject(ContributionRegistry);

  readonly channels = stateChannels(inject(HiddenViewsService), this.paneTree);

  readonly panels: PanelDeclarations = {
    panelRegions: regionIdsOfType(inject(SHELL_LAYOUT), 'panel'),
    declaredPaths: (region) => this.panelGroups.declaredPaths(region),
  };

  async switchTo(
    id: string,
    options: { keepAddress?: boolean } = {},
  ): Promise<void> {
    if (id === this.active.id()) {
      return;
    }
    if (!this.catalog.exists(id)) {
      if (isDevMode()) {
        console.warn(
          `Workspace "${id}": no such workspace is declared or saved — the switch does nothing.`,
        );
      }
      return;
    }
    await this.enter(id);
    if (options.keepAddress !== true) {
      this.chooseCurrentAddress();
    }
  }

  async enter(id: string): Promise<void> {
    this.active.set(id);
    await this.hydrateActive();
    this.warnDeclarationGaps(id);
  }

  apply(state: Readonly<Record<string, string>>): void {
    for (const key of WORKSPACE_STATE_KEYS) {
      this.channels[key].hydrate(state[key]);
    }
  }

  baselineOf(id: string): Readonly<Record<string, string>> {
    const saved = this.catalog.saved().find((workspace) => workspace.id === id);
    if (saved) {
      return saved.baseline;
    }
    const definition = this.catalog.definitionOf(id);
    return definition ? definitionBaseline(definition, this.panels) : {};
  }

  currentState(): Promise<Record<string, string>> {
    return readWorkspaceState(
      this.workingStateStore,
      (key) => this.active.scopedKey(key),
      WORKSPACE_STATE_KEYS,
    );
  }

  chooseCurrentAddress(): void {
    this.settlement.choose(activeContentPath(this.paneTree));
  }

  warnDeclarationGaps(id: string): void {
    const definition = this.catalog.definitionOf(id);
    if (!isDevMode() || definition === undefined) {
      return;
    }
    warnDeclarationGaps(definition, {
      routes: this.registry.contentRoutes(),
      declaredPaths: this.panels.declaredPaths,
    });
  }

  private async hydrateActive(): Promise<void> {
    const baseline = this.baselineOf(this.active.id());
    const stored = await this.currentState();
    for (const key of WORKSPACE_STATE_KEYS) {
      this.channels[key].hydrate(stored[key] ?? baseline[key]);
    }
  }
}

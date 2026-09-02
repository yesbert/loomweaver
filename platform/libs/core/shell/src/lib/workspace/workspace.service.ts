import { computed, inject, isDevMode, Service, signal } from '@angular/core';
import { SETTINGS_STORE } from '../persistence/settings-store';
import { WORKING_STATE_STORE } from '../persistence/working-state-store';
import { ContentTabsService } from '../regions/content/tabs/content-tabs.service';
import { PaneTreeService } from '../regions/pane/tree/pane-tree.service';
import { SHELL_LAYOUT } from '../layout/layout';
import { ContributionRegistry } from '../plugin/contribution-registry';
import { BootAddress } from '../regions/content/routing/boot-address';
import { ContentRouter } from '../regions/content/routing/content-router';
import { isHomePath, normalizePath } from '../regions/content/content-path';
import { PanelGroupService } from '../regions/panel/panel-group.service';
import { RetainedViewStash } from '../regions/pane/retention/retained-view-stash';
import { HiddenViewsService } from '../regions/panel/hidden-views.service';
import { hydrateAsync, readStoredValue } from '../persistence/hydrate';
import { StateSyncService } from '../persistence/state-sync.service';
import {
  ActiveWorkspaceService,
  DEFAULT_WORKSPACE_ID,
  workspaceScopedKey,
} from './active-workspace.service';
import {
  WorkspaceDefinition,
  auditWorkspaceDefinitions,
  claimsOf,
  dedupedDefinitions,
} from './workspace-definition';
import {
  claimFor,
  settlementFor,
  withoutConflicts,
  type WorkspaceClaim,
} from './workspace-claims';
import { warnDeclarationGaps } from './workspace-warnings';
import {
  activeStateDiffers,
  changedWorkspaceIds,
  storedStateDiffers,
  workspaceChangeShape,
  type ChangeShape,
} from './workspace-changes';
import { WORKSPACE_DEFINITIONS } from './provide-workspaces';
import { everyWorkspaceOrigin } from './usability/workspace-usability';
import {
  definitionBaseline,
  parseWorkspaces,
  stateChannels,
  readWorkspaceState,
  writeWorkspaceState,
  HIDDEN_VIEWS_KEY,
  PANE_TREES_KEY,
  WORKSPACE_KEYS,
  WORKSPACES_KEY as STORAGE_KEY,
  type Workspace,
} from './workspace-state';
import { assignWorkspaceInitials } from './workspace-initials';
import { activeContentPath } from './active-content-path';

@Service()
export class WorkspaceService {
  private readonly store = inject(SETTINGS_STORE);
  private readonly workingState = inject(WORKING_STATE_STORE);
  private readonly active = inject(ActiveWorkspaceService);
  private readonly paneTree = inject(PaneTreeService);
  private readonly panelGroups = inject(PanelGroupService);
  private readonly stash = inject(RetainedViewStash);
  private readonly hiddenViews = inject(HiddenViewsService);
  private readonly tabs = inject(ContentTabsService);
  private readonly bootAddress = inject(BootAddress);
  private readonly contentRouter = inject(ContentRouter);
  private readonly sync = inject(StateSyncService);
  private readonly registry = inject(ContributionRegistry);
  private readonly panelRegions = inject(SHELL_LAYOUT)
    .regions.filter((region) => region.type === 'panel')
    .map((region) => region.id);
  private readonly definitionBatches =
    inject(WORKSPACE_DEFINITIONS, { optional: true }) ?? [];

  readonly definitions: readonly WorkspaceDefinition[] = dedupedDefinitions(
    this.definitionBatches.flat(),
  );

  private readonly list = signal<Workspace[]>(
    parseWorkspaces(this.store.peek?.(STORAGE_KEY)),
  );

  private chosenAddress: string | null = null;

  readonly workspaces = this.list.asReadonly();
  readonly activeId = this.active.id;

  readonly initials = computed(() => assignWorkspaceInitials(this.list()));

  private readonly keyed = stateChannels(this.hiddenViews, this.paneTree, {
    hiddenViews: HIDDEN_VIEWS_KEY,
    paneTrees: PANE_TREES_KEY,
  });

  readonly hasChanges = computed(() =>
    activeStateDiffers(
      this.keyed,
      this.baselineOf(this.active.id()),
      this.shape(),
    ),
  );

  readonly changedIds = computed(() =>
    changedWorkspaceIds({
      activeId: this.active.id(),
      activeDiffers: this.hasChanges(),
      canReadBack: this.workingState.peek !== undefined,
      candidates: [
        { id: DEFAULT_WORKSPACE_ID, baseline: {} },
        ...this.definitions.map((definition) => ({
          id: definition.id,
          baseline: this.definitionBaselineOf(definition),
        })),
        ...this.list(),
      ],
      storedDiffers: (candidate) =>
        storedStateDiffers(
          this.workingState.peek?.bind(this.workingState),
          workspaceScopedKey,
          candidate,
          this.shape(),
        ),
    }),
  );

  constructor() {
    const setList = (raw: string | undefined) =>
      this.list.set(parseWorkspaces(raw));
    hydrateAsync(this.store, STORAGE_KEY, setList);
    this.sync.register('settings', STORAGE_KEY, setList);
    if (isDevMode()) {
      const all = this.definitionBatches.flat();
      for (const problem of auditWorkspaceDefinitions(all, this.panelRegions)) {
        console.warn(problem);
      }
    }
    this.layOutWhenWorkspaceReady();
  }

  async saveCurrent(name: string): Promise<void> {
    const baseline = await this.currentState();
    const id = crypto.randomUUID();
    const origin = this.originOf(this.active.id());
    this.commit([
      ...this.list(),
      { id, name, baseline, ...(origin !== null && { origin }) },
    ]);
    this.active.set(id);
    this.applyState(baseline);
  }

  async saveBaseline(): Promise<void> {
    const id = this.active.id();
    if (id === DEFAULT_WORKSPACE_ID || this.definitionOf(id) !== undefined) {
      return;
    }
    const baseline = await this.currentState();
    this.commit(this.list().map((w) => (w.id === id ? { ...w, baseline } : w)));
  }

  wouldSettle(path: string): boolean {
    return (
      this.chosenAddress !== normalizePath(path) &&
      this.settlementDestination(path) !== null
    );
  }

  async settle(path: string): Promise<void> {
    const chosen = this.chosenAddress;
    this.chosenAddress = null;
    if (chosen !== null && chosen === normalizePath(path)) {
      return;
    }
    const destination = this.settlementDestination(path);
    if (destination !== null) {
      await this.switchTo(destination, { keepAddress: true });
    }
  }

  async switchTo(
    id: string,
    options: { keepAddress?: boolean } = {},
  ): Promise<void> {
    if (id === this.active.id()) {
      return;
    }
    if (!this.exists(id)) {
      if (isDevMode()) {
        console.warn(
          `Workspace "${id}": no such workspace is declared or saved — the switch does nothing.`,
        );
      }
      return;
    }
    const baseline = this.baselineOf(id);
    this.active.set(id);
    const stored: Record<string, string | undefined> = {};
    for (const key of WORKSPACE_KEYS) {
      stored[key] = await readStoredValue(
        this.workingState,
        this.active.scopedKey(key),
      );
    }
    for (const key of WORKSPACE_KEYS) {
      this.keyed[key].hydrate(stored[key] ?? baseline[key]);
    }
    this.warnDeclarationGaps(id);
    if (options.keepAddress !== true) {
      this.chooseAddress(activeContentPath(this.paneTree));
    }
  }

  reset(id: string = this.active.id()): void {
    if (!this.exists(id)) {
      return;
    }
    if (id !== this.active.id()) {
      this.stash.evictWorkspace(id);
      writeWorkspaceState(
        this.workingState,
        id,
        this.baselineOf(id),
        WORKSPACE_KEYS,
      );
      return;
    }
    this.applyState(this.baselineOf(id));
    this.warnDeclarationGaps(id);
    this.chooseAddress(activeContentPath(this.paneTree));
  }

  resetAll(): void {
    for (const workspace of everyWorkspaceOrigin(
      this.definitions,
      this.list(),
      (id) => this.originOf(id),
    )) {
      this.reset(workspace.id);
    }
    this.reset(DEFAULT_WORKSPACE_ID);
  }

  rename(id: string, name: string): void {
    if (this.definitionOf(id) !== undefined) {
      return;
    }
    this.commit(this.list().map((w) => (w.id === id ? { ...w, name } : w)));
  }

  remove(id: string): void {
    if (id === DEFAULT_WORKSPACE_ID || this.definitionOf(id) !== undefined) {
      return;
    }
    this.commit(this.list().filter((w) => w.id !== id));
    this.stash.evictWorkspace(id);
    for (const key of WORKSPACE_KEYS) {
      void this.workingState.delete(workspaceScopedKey(key, id));
    }
    if (id === this.active.id()) {
      void this.switchTo(DEFAULT_WORKSPACE_ID);
    }
  }

  originOf(id: string): string | null {
    if (this.definitionOf(id) !== undefined) {
      return id;
    }
    const origin = this.list().find((workspace) => workspace.id === id)?.origin;
    return origin !== undefined && this.definitionOf(origin) !== undefined
      ? origin
      : null;
  }

  claimsOfWorkspace(id: string): readonly WorkspaceClaim[] {
    const origin = this.originOf(id);
    return origin === null
      ? []
      : this.claims().filter((claim) => claim.workspaceId === origin);
  }

  destinationFor(path: string): string | null {
    return claimFor(this.claims(), path)?.workspaceId ?? null;
  }

  private shape(): ChangeShape {
    return workspaceChangeShape(
      WORKSPACE_KEYS,
      HIDDEN_VIEWS_KEY,
      PANE_TREES_KEY,
      (dock) => this.panelGroups.declaredPaths(dock),
    );
  }

  private claims(): readonly WorkspaceClaim[] {
    return withoutConflicts(claimsOf(this.definitions));
  }

  private exists(id: string): boolean {
    return (
      id === DEFAULT_WORKSPACE_ID ||
      this.definitionOf(id) !== undefined ||
      this.list().some((workspace) => workspace.id === id)
    );
  }

  private definitionOf(id: string): WorkspaceDefinition | undefined {
    return this.definitions.find((definition) => definition.id === id);
  }

  private baselineOf(id: string): Readonly<Record<string, string>> {
    const stored = this.list().find((w) => w.id === id)?.baseline;
    if (stored) {
      return stored;
    }
    const definition = this.definitionOf(id);
    return definition ? this.definitionBaselineOf(definition) : {};
  }

  private definitionBaselineOf(
    definition: WorkspaceDefinition,
  ): Record<string, string> {
    return definitionBaseline(definition, {
      panelRegions: this.panelRegions,
      declaredPaths: (region) => this.panelGroups.declaredPaths(region),
      hiddenViewsKey: HIDDEN_VIEWS_KEY,
      paneTreesKey: PANE_TREES_KEY,
    });
  }

  private warnDeclarationGaps(id: string): void {
    const definition = this.definitionOf(id);
    if (!isDevMode() || definition === undefined) {
      return;
    }
    warnDeclarationGaps(definition, {
      routes: this.registry.contentRoutes(),
      declaredPaths: (region) => this.panelGroups.declaredPaths(region),
    });
  }

  private currentState(): Promise<Record<string, string>> {
    return readWorkspaceState(
      this.workingState,
      (key) => this.active.scopedKey(key),
      WORKSPACE_KEYS,
    );
  }

  private layOutWhenWorkspaceReady(): void {
    void this.active.ready.then(() => this.layOutAdoptedWorkspace());
  }

  private layOutAdoptedWorkspace(): void {
    const id = this.active.takeAdoption();
    if (id === null) {
      return;
    }
    this.applyState(this.baselineOf(id));
    this.warnDeclarationGaps(id);
    if (isHomePath(this.bootAddress.path)) {
      this.chooseAddress(activeContentPath(this.paneTree));
    }
  }

  private applyState(state: Readonly<Record<string, string>>): void {
    for (const key of WORKSPACE_KEYS) {
      this.keyed[key].hydrate(state[key]);
    }
  }


  private commit(next: Workspace[]): void {
    this.list.set(next);
    void this.store.set(STORAGE_KEY, JSON.stringify(next));
  }

  private chooseAddress(path: string): void {
    this.chosenAddress = normalizePath(path);
    this.contentRouter.hold(path);
    this.tabs.navigateTo(path);
  }

  private settlementDestination(path: string): string | null {
    const here = this.active.id();
    return settlementFor(
      this.claims(),
      this.claimsOfWorkspace(here),
      here,
      path,
    );
  }

}

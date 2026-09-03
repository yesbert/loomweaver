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
import { WorkspaceGuard } from './workspace-guard';
import {
  BaselineContext,
  activeClaims,
  baselineOf,
  changeCandidates,
  claimsOfWorkspace,
  definitionOf,
  originOf,
  settlementDestination,
  workspaceExists,
} from './baseline/workspace-lookup';
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
  dedupedDefinitions,
} from './workspace-definition';
import { claimFor, type WorkspaceClaim } from './workspace-claims';
import { warnDeclarationGaps } from './workspace-warnings';
import {
  activeStateDiffers,
  changedWorkspaceIds,
  storedStateDiffers,
  workspaceChangeShape,
  type ChangeShape,
} from './baseline/workspace-changes';
import { WORKSPACE_DEFINITIONS } from './provide-workspaces';
import { everyWorkspaceOrigin } from './usability/workspace-usability';
import {
  parseWorkspaces,
  stateChannels,
  readWorkspaceState,
  writeWorkspaceState,
  HIDDEN_VIEWS_KEY,
  PANE_TREES_KEY,
  WORKSPACE_KEYS,
  WORKSPACES_KEY as STORAGE_KEY,
  type Workspace,
} from './baseline/workspace-state';
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
  private readonly guard = inject(WorkspaceGuard);
  private readonly hiddenViews = inject(HiddenViewsService);
  private readonly tabs = inject(ContentTabsService);
  private readonly bootAddress = inject(BootAddress);
  private readonly contentRouter = inject(ContentRouter);
  private readonly sync = inject(StateSyncService);
  private readonly registry = inject(ContributionRegistry);
  private readonly panelRegions = inject(SHELL_LAYOUT)
    .regions.filter((region) => region.type === 'panel')
    .map((region) => region.id);
  private readonly baselineContext: BaselineContext = {
    panelRegions: this.panelRegions,
    declaredPaths: (region) => this.panelGroups.declaredPaths(region),
  };
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
      candidates: changeCandidates(
        this.definitions,
        this.list(),
        this.baselineContext,
      ),
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

  async reset(id: string = this.active.id()): Promise<boolean> {
    if (!this.exists(id)) {
      return false;
    }
    if (id === this.active.id() && !(await this.guard.confirmDiscardAll())) {
      return false;
    }
    this.resetNow(id);
    return true;
  }

  async resetAll(): Promise<boolean> {
    if (!(await this.guard.confirmDiscardAll())) {
      return false;
    }
    for (const workspace of everyWorkspaceOrigin(
      this.definitions,
      this.list(),
      (id) => this.originOf(id),
    )) {
      this.resetNow(workspace.id);
    }
    this.resetNow(DEFAULT_WORKSPACE_ID);
    return true;
  }

  rename(id: string, name: string): void {
    if (this.definitionOf(id) !== undefined) {
      return;
    }
    this.commit(this.list().map((w) => (w.id === id ? { ...w, name } : w)));
  }

  async remove(id: string): Promise<boolean> {
    if (id === DEFAULT_WORKSPACE_ID || this.definitionOf(id) !== undefined) {
      return false;
    }
    if (!(await this.guard.confirmDiscardParked(id))) {
      return false;
    }
    this.commit(this.list().filter((w) => w.id !== id));
    this.stash.evictWorkspace(id);
    for (const key of WORKSPACE_KEYS) {
      void this.workingState.delete(workspaceScopedKey(key, id));
    }
    if (id === this.active.id()) {
      void this.switchTo(DEFAULT_WORKSPACE_ID);
    }
    return true;
  }

  originOf(id: string): string | null {
    return originOf(id, this.definitions, this.list());
  }

  claimsOfWorkspace(id: string): readonly WorkspaceClaim[] {
    return claimsOfWorkspace(id, this.definitions, this.list());
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
    return activeClaims(this.definitions);
  }

  private resetNow(id: string): void {
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

  private exists(id: string): boolean {
    return workspaceExists(id, this.definitions, this.list());
  }

  private definitionOf(id: string): WorkspaceDefinition | undefined {
    return definitionOf(this.definitions, id);
  }

  private baselineOf(id: string): Readonly<Record<string, string>> {
    return baselineOf(id, this.definitions, this.list(), this.baselineContext);
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
    return settlementDestination(
      path,
      this.active.id(),
      this.definitions,
      this.list(),
    );
  }
}

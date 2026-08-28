import { computed, inject, isDevMode, Service, signal } from '@angular/core';
import { SETTINGS_STORE } from '../persistence/settings-store';
import { WORKING_STATE_STORE } from '../persistence/working-state-store';
import { ContentTabsService } from '../regions/content/tabs/content-tabs.service';
import { CONTENT_DOCK } from '../regions/pane/tree/pane-address';
import { PaneTreeService } from '../regions/pane/tree/pane-tree.service';
import { VIEW_PANE_PREFIX } from '../regions/pane/tree/pane-address';
import { activeTab } from '../regions/pane/tree/pane-node';
import { findLeaf } from '../regions/pane/tree/pane-queries';
import { SHELL_LAYOUT } from '../layout/layout';
import { ContributionRegistry } from '../plugin/contribution-registry';
import { BootAddress } from '../regions/content/routing/boot-address';
import { isHomePath } from '../regions/content/content-path';
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
  workspaceBaseline,
} from './workspace-definition';
import {
  claimFor,
  settlementFor,
  withoutConflicts,
  type WorkspaceClaim,
} from './workspace-claims';
import { declarationGaps } from './workspace-warnings';
import { stateDiffers, type ChangeShape } from './workspace-changes';
import { WORKSPACE_DEFINITIONS } from './provide-workspaces';
import { assignWorkspaceInitials } from './workspace-initials';

const STORAGE_KEY = 'lw.shell.workspaces';

const HIDDEN_VIEWS_KEY = 'lw.shell.hidden-views';

const PANE_TREES_KEY = 'lw.shell.pane-trees';

const WORKSPACE_KEYS = [HIDDEN_VIEWS_KEY, PANE_TREES_KEY] as const;

export interface Workspace {
  readonly id: string;
  readonly name: string;
  readonly baseline: Readonly<Record<string, string>>;
  readonly origin?: string;
}

function parse(raw: string | undefined): Workspace[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (w): w is Workspace =>
        !!w &&
        typeof (w as Workspace).id === 'string' &&
        typeof (w as Workspace).name === 'string' &&
        typeof (w as Workspace).baseline === 'object',
    );
  } catch {
    return [];
  }
}

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
    parse(this.store.peek?.(STORAGE_KEY)),
  );
  readonly workspaces = this.list.asReadonly();
  readonly activeId = this.active.id;

  readonly initials = computed(() => assignWorkspaceInitials(this.list()));

  private readonly keyed: Record<
    string,
    {
      hydrate: (raw: string | undefined) => void;
      serialize: () => string;
    }
  > = {
    [HIDDEN_VIEWS_KEY]: {
      hydrate: (raw) => this.hiddenViews.hydrate(raw),
      serialize: () => this.hiddenViews.serialize(),
    },
    [PANE_TREES_KEY]: {
      hydrate: (raw) => this.paneTree.hydrate(raw),
      serialize: () => this.paneTree.serialize(),
    },
  };

  readonly hasChanges = computed(() => {
    const baseline = this.baselineOf(this.active.id());
    return stateDiffers(
      (key) => this.keyed[key].serialize(),
      (key) => baseline[key],
      this.changeShape(),
    );
  });

  readonly changedIds = computed(() => {
    const ids = new Set<string>();
    const activeId = this.active.id();
    if (this.hasChanges()) {
      ids.add(activeId);
    }
    if (!this.workingState.peek) {
      return ids;
    }
    for (const workspace of [
      { id: DEFAULT_WORKSPACE_ID, baseline: {} as Record<string, string> },
      ...this.definitions.map((definition) => ({
        id: definition.id,
        baseline: this.definitionBaselineOf(definition),
      })),
      ...this.list(),
    ]) {
      if (workspace.id !== activeId && this.storedDiffers(workspace)) {
        ids.add(workspace.id);
      }
    }
    return ids;
  });

  constructor() {
    hydrateAsync(this.store, STORAGE_KEY, (raw) => this.list.set(parse(raw)));
    this.sync.register('settings', STORAGE_KEY, (raw) =>
      this.list.set(parse(raw)),
    );
    if (isDevMode()) {
      for (const problem of auditWorkspaceDefinitions(
        this.definitionBatches.flat(),
        this.panelRegions,
      )) {
        console.warn(problem);
      }
    }
    void this.active.ready.then(() => this.layOutAdoptedWorkspace());
  }

  async saveCurrent(name: string): Promise<void> {
    const baseline = await this.currentState();
    const id = crypto.randomUUID();
    const origin = this.originOf(this.active.id());
    this.commit([
      ...this.list(),
      { id, name, baseline, ...(origin === null ? {} : { origin }) },
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

  async settle(path: string): Promise<void> {
    const here = this.active.id();
    const destination = settlementFor(
      this.claims(),
      this.claimsOfWorkspace(here),
      here,
      path,
    );
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
      this.tabs.navigateTo(this.activeContentPath());
    }
  }

  reset(): void {
    const id = this.active.id();
    this.applyState(this.baselineOf(id));
    this.warnDeclarationGaps(id);
    this.tabs.navigateTo(this.activeContentPath());
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

  private claims(): readonly WorkspaceClaim[] {
    return withoutConflicts(claimsOf(this.definitions));
  }

  private exists(id: string): boolean {
    return (
      id === DEFAULT_WORKSPACE_ID ||
      this.definitionOf(id) !== undefined ||
      this.list().some((w) => w.id === id)
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
    const state = workspaceBaseline(definition, {
      panelRegions: this.panelRegions,
      declaredPaths: (region) => this.panelGroups.declaredPaths(region),
    });
    return {
      ...(state.hiddenViews === undefined
        ? {}
        : { [HIDDEN_VIEWS_KEY]: state.hiddenViews }),
      ...(state.trees === undefined ? {} : { [PANE_TREES_KEY]: state.trees }),
    };
  }

  private warnDeclarationGaps(id: string): void {
    const definition = this.definitionOf(id);
    if (!isDevMode() || definition === undefined) {
      return;
    }
    for (const gap of declarationGaps(definition, {
      routes: this.registry.contentRoutes(),
      declaredPaths: (region) => this.panelGroups.declaredPaths(region),
    })) {
      console.warn(gap);
    }
  }

  private storedDiffers(workspace: {
    id: string;
    baseline: Readonly<Record<string, string>>;
  }): boolean {
    return stateDiffers(
      (key) => this.workingState.peek?.(workspaceScopedKey(key, workspace.id)),
      (key) => workspace.baseline[key],
      this.changeShape(),
    );
  }

  private changeShape(): ChangeShape {
    return {
      keys: WORKSPACE_KEYS,
      hiddenViewsKey: HIDDEN_VIEWS_KEY,
      paneTreesKey: PANE_TREES_KEY,
      declaredPaths: (dock) => this.panelGroups.declaredPaths(dock),
    };
  }

  private async currentState(): Promise<Record<string, string>> {
    const state: Record<string, string> = {};
    for (const key of WORKSPACE_KEYS) {
      const raw = await readStoredValue(
        this.workingState,
        this.active.scopedKey(key),
      );
      if (raw != null) {
        state[key] = raw;
      }
    }
    return state;
  }

  private layOutAdoptedWorkspace(): void {
    const id = this.active.takeAdoption();
    if (id === null) {
      return;
    }
    this.applyState(this.baselineOf(id));
    this.warnDeclarationGaps(id);
    if (isHomePath(this.bootAddress.path)) {
      this.tabs.navigateTo(this.activeContentPath());
    }
  }

  private applyState(state: Readonly<Record<string, string>>): void {
    for (const key of WORKSPACE_KEYS) {
      this.keyed[key].hydrate(state[key]);
    }
  }

  private activeContentPath(): string {
    const primary = findLeaf(
      this.paneTree.tree(CONTENT_DOCK),
      this.paneTree.primaryId(CONTENT_DOCK),
    );
    const path = primary ? activeTab(primary)?.path : undefined;
    if (!path || path.startsWith(VIEW_PANE_PREFIX)) {
      return '';
    }
    return path;
  }

  private commit(next: Workspace[]): void {
    this.list.set(next);
    void this.store.set(STORAGE_KEY, JSON.stringify(next));
  }
}

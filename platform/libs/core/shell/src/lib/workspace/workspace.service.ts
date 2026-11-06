import { computed, inject, Service } from '@angular/core';
import { WORKING_STATE_STORE } from '../persistence/working-state-store';
import { TabCloseHooks } from '../regions/content/tabs/tab-close-hooks';
import { TabNavigationService } from '../regions/content/tabs/tab-navigation.service';
import { RetainedViewStash } from '../regions/pane/retention/retained-view-stash';
import {
  PANE_TREES_KEY,
  storedTabPaths,
} from '../regions/pane/tree/pane-tree-storage';
import {
  ActiveWorkspaceService,
  workspaceScopedKey,
} from './active-workspace.service';
import { WORKSPACE_STATE_KEYS } from './working-state/state-channels';
import { StoredStateRevision } from './working-state/stored-state-revision';
import { unsavedWorkspaces } from './working-state/unsaved-workspaces';
import { writeWorkspaceState } from './working-state/working-state-io';
import { WorkspaceCatalog } from './catalog/workspace-catalog';
import { BUILT_IN_WORKSPACE_ID } from './declaration/composed-definitions';
import { WorkbenchOpening } from './opening/workbench-opening';
import { AddressSettlement } from './settlement/address-settlement';
import { type WorkspaceClaim } from './workspace-claims';
import { WorkspaceDiscard } from './workspace-discard';
import { assignWorkspaceInitials } from './workspace-initials';
import { WorkspaceSwitcher } from './workspace-switcher';

@Service()
export class WorkspaceService {
  private readonly catalog = inject(WorkspaceCatalog);
  private readonly switcher = inject(WorkspaceSwitcher);
  private readonly settlement = inject(AddressSettlement);
  private readonly active = inject(ActiveWorkspaceService);
  private readonly stash = inject(RetainedViewStash);
  private readonly discard = inject(WorkspaceDiscard);
  private readonly tabNavigation = inject(TabNavigationService);
  private readonly closeHooks = inject(TabCloseHooks);
  private readonly workingStateStore = inject(WORKING_STATE_STORE);
  private readonly storedRevision = inject(StoredStateRevision);

  readonly definitions = this.catalog.definitions;
  readonly workspaces = this.catalog.saved;
  readonly activeId = this.active.id;

  readonly initials = computed(() =>
    assignWorkspaceInitials(this.workspaces()),
  );

  private readonly unsaved = unsavedWorkspaces({
    channels: this.switcher.channels,
    panels: this.switcher.panels,
    activeId: () => this.active.id(),
    baselineOf: (id) => this.switcher.baselineOf(id),
    workspaces: () => this.workspaces(),
    definitions: this.definitions,
    workingStateStore: this.workingStateStore,
    storedRevision: this.storedRevision.current,
  });

  readonly hasChanges = this.unsaved.hasChanges;
  readonly changedIds = this.unsaved.changedIds;

  constructor() {
    inject(WorkbenchOpening).start();
  }

  async saveCurrent(name: string): Promise<void> {
    const baseline = await this.switcher.currentState();
    const id = crypto.randomUUID();
    const origin = this.originOf(this.active.id());
    this.catalog.commit([
      ...this.workspaces(),
      { id, name, baseline, ...(origin !== null && { origin }) },
    ]);
    this.active.set(id);
    this.switcher.apply(baseline);
  }

  async saveBaseline(): Promise<void> {
    const id = this.active.id();
    if (this.catalog.isBuiltInOrDeclared(id)) {
      return;
    }
    const baseline = await this.switcher.currentState();
    this.catalog.commit(
      this.workspaces().map((workspace) =>
        workspace.id === id ? { ...workspace, baseline } : workspace,
      ),
    );
  }

  wouldSettle(path: string): boolean {
    return this.settlement.wouldSettle(path);
  }

  async settle(path: string): Promise<void> {
    const destination = this.settlement.takeDestination(path);
    if (destination === null) {
      return;
    }

    this.settlement.leaveWithheld(path);
    await this.switchTo(destination, { keepAddress: true });
    this.tabNavigation.keepAddress(path);
  }

  withhold(path: string): void {
    this.settlement.withhold(path);
  }

  switchTo(id: string, options: { keepAddress?: boolean } = {}): Promise<void> {
    return this.switcher.switchTo(id, options);
  }

  async reset(id: string = this.active.id()): Promise<boolean> {
    if (!this.catalog.exists(id)) {
      return false;
    }
    const allowed =
      id === this.active.id()
        ? await this.discard.confirmDiscardAll()
        : await this.discard.confirmDiscardOf(id);
    if (!allowed) {
      return false;
    }
    await this.resetNow(id);
    return true;
  }

  async resetAll(): Promise<boolean> {
    if (!(await this.discard.confirmDiscardAll())) {
      return false;
    }
    for (const workspace of this.catalog.everyOrigin()) {
      await this.resetNow(workspace.id);
    }
    if (this.catalog.offersBuiltIn) {
      await this.resetNow(BUILT_IN_WORKSPACE_ID);
    }
    return true;
  }

  rename(id: string, name: string): void {
    if (this.catalog.definitionOf(id) !== undefined) {
      return;
    }
    this.catalog.commit(
      this.workspaces().map((workspace) =>
        workspace.id === id ? { ...workspace, name } : workspace,
      ),
    );
  }

  async remove(id: string): Promise<boolean> {
    if (this.catalog.isBuiltInOrDeclared(id) || !(await this.discard.confirmDiscardOf(id))) {
      return false;
    }
    this.catalog.commit(
      this.workspaces().filter((workspace) => workspace.id !== id),
    );
    this.stash.evictWorkspace(id);
    for (const key of WORKSPACE_STATE_KEYS) {
      void this.workingStateStore.delete(workspaceScopedKey(key, id));
    }
    if (id === this.active.id()) {
      void this.leaveRemoved(id);
    }
    return true;
  }

  originOf(id: string): string | null {
    return this.catalog.originOf(id);
  }

  claimsOfWorkspace(id: string): readonly WorkspaceClaim[] {
    return this.catalog.claimsOfWorkspace(id);
  }

  destinationFor(path: string): string | null {
    return this.settlement.destinationFor(path);
  }

  private async leaveRemoved(id: string): Promise<void> {
    await this.switchTo(this.catalog.startingId);
    this.discard.forgetOnceLetGo(id);
  }

  private async resetNow(id: string): Promise<void> {
    const stored =
      id === this.active.id() ? undefined : await this.switcher.stateOf(id);
    if (stored !== undefined && id !== this.active.id()) {
      this.resetParked(id, stored);
      return;
    }
    this.stash.endHolds(id);
    this.closeHooks.closing(() =>
      this.switcher.apply(this.switcher.baselineOf(id)),
    );
    this.switcher.warnDeclarationGaps(id);
    this.switcher.chooseCurrentAddress();
  }

  private resetParked(
    id: string,
    stored: Readonly<Record<string, string>>,
  ): void {
    const baseline = this.switcher.baselineOf(id);
    this.stash.evictWorkspace(id);
    writeWorkspaceState(
      this.workingStateStore,
      id,
      baseline,
      WORKSPACE_STATE_KEYS,
    );
    this.storedRevision.advance();
    this.closeHooks.discarded(
      storedTabPaths(stored[PANE_TREES_KEY] ?? baseline[PANE_TREES_KEY]),
      storedTabPaths(baseline[PANE_TREES_KEY]),
    );
  }
}

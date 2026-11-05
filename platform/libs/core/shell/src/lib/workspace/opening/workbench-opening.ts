import { inject, Service } from '@angular/core';
import { StateSyncService } from '../../persistence/cross-tab/state-sync.service';
import { isHomePath } from '../../regions/content/content-path';
import { BootAddress } from '../../regions/content/routing/boot-address';
import { ContentRouter } from '../../regions/content/routing/content-router';
import { ContentTabState } from '../../regions/content/tabs/content-tab-state';
import { TabNavigationService } from '../../regions/content/tabs/tab-navigation.service';
import { activeContentPath } from '../../regions/pane/tree/active-content-path';
import { PANE_TREES_KEY } from '../../regions/pane/tree/pane-tree-storage';
import { PaneTreeService } from '../../regions/pane/tree/pane-tree.service';
import { ActiveWorkspaceService } from '../active-workspace.service';
import { WORKSPACE_STATE_KEYS } from '../working-state/state-channels';
import { WorkspaceCatalog } from '../catalog/workspace-catalog';
import { WorkspaceDefinition } from '../declaration/workspace-definition';
import { AddressSettlement } from '../settlement/address-settlement';
import { WorkspaceDiscard } from '../workspace-discard';
import { WorkspaceSwitcher } from '../workspace-switcher';

export function declaredStart(
  definitions: readonly WorkspaceDefinition[],
): WorkspaceDefinition | undefined {
  return definitions.find((definition) => definition.initial);
}

export function atTheOpeningAddress(boot: string, here: string): boolean {
  return isHomePath(boot) && isHomePath(here);
}

@Service()
export class WorkbenchOpening {
  private readonly active = inject(ActiveWorkspaceService);
  private readonly catalog = inject(WorkspaceCatalog);
  private readonly switcher = inject(WorkspaceSwitcher);
  private readonly settlement = inject(AddressSettlement);
  private readonly paneTree = inject(PaneTreeService);
  private readonly tabState = inject(ContentTabState);
  private readonly tabNavigation = inject(TabNavigationService);
  private readonly bootAddress = inject(BootAddress);
  private readonly contentRouter = inject(ContentRouter);
  private readonly sync = inject(StateSyncService);
  private readonly discard = inject(WorkspaceDiscard);

  private adoptions = 0;

  start(): void {
    this.sync.onNamespaceAdopted(() => this.rereadForAdoptedNamespace());
    void this.active.ready.then(() => this.openWorkbench());
  }

  private async openWorkbench(): Promise<void> {
    const opened = this.active.id();
    const adopted = this.active.takeAdoption();
    if (adopted !== null) {
      await this.restoreAdopted(adopted);
    }
    await this.startWhereTheDistributionSays(adopted !== null);
    void this.leaveWhereUnlisted(opened);
  }

  private async restoreAdopted(id: string): Promise<void> {
    const reading = this.switcher.currentState();
    await this.paneTree.arrangementSettled;
    const stored = await reading;
    if (this.active.id() !== id) {
      return;
    }
    this.switcher.restore(stored);
    this.switcher.warnDeclarationGaps(id);
    this.tabNavigation.keepAddress(this.tabState.activePath());
  }

  private async leaveWhereUnlisted(opened: string): Promise<void> {
    const adoptions = this.adoptions;
    const stillUnlisted = async () =>
      adoptions === this.adoptions &&
      !this.catalog.exists(opened) &&
      (await this.active.isWhatTheStoreRemembers());
    if (this.catalog.exists(opened) || !(await this.catalog.savedRead())) {
      return;
    }
    await this.paneTree.arrangementSettled;
    if (!(await stillUnlisted())) {
      return;
    }
    const address = this.tabState.activePath();
    const allowed = await this.discard.confirmDiscardOf(opened, address);
    if (!allowed || !(await stillUnlisted())) {
      return;
    }
    if (this.active.id() !== opened) {
      this.discard.forget(opened);
      return;
    }
    const entering = this.switcher.enter(this.catalog.startingId);
    this.discard.forget(opened);
    await entering;
    this.tabNavigation.keepAddress(address);
    this.discard.forgetOnceLetGo(opened);
  }

  private async startWhereTheDistributionSays(entered: boolean): Promise<void> {
    const declared = declaredStart(this.catalog.definitions);
    if (declared?.content === undefined || !this.atTheOpeningAddress()) {
      return;
    }
    if (!entered) {
      if (this.active.wasChosen()) {
        return;
      }
      await this.paneTree.arrangementSettled;
      if (!this.atTheOpeningAddress() || this.active.wasChosen()) {
        return;
      }
      await this.switcher.enter(declared.id);
    }
    const path = activeContentPath(this.paneTree);
    if (path === '' || !this.atTheOpeningAddress()) {
      return;
    }
    this.settlement.choose(path, { replace: true });
  }

  private atTheOpeningAddress(): boolean {
    return (
      atTheOpeningAddress(this.bootAddress.path, this.contentRouter.here()) &&
      !this.contentRouter.ownsTheOpeningAddress()
    );
  }

  private async rereadForAdoptedNamespace(): Promise<void> {
    this.adoptions += 1;
    await this.active.reread();
    const stored = await this.switcher.currentState();
    const found = WORKSPACE_STATE_KEYS.filter(
      (key) => stored[key] !== undefined,
    );
    if (found.includes(PANE_TREES_KEY)) {
      this.settlement.forgetWithheld();
    }
    for (const key of found) {
      this.switcher.channels[key].hydrate(stored[key]);
    }
    const shown = this.tabState.activePath();
    const destination = this.settlement.settlementDestination(shown);
    if (destination !== null) {
      this.settlement.leaveWithheld(shown);
      await this.switcher.switchTo(destination, { keepAddress: true });
    }
    if (found.length > 0 || destination !== null) {
      this.tabNavigation.keepAddress(shown);
    }
    void this.leaveWhereUnlisted(this.active.id());
  }
}

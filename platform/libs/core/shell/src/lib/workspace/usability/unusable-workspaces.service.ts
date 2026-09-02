import { computed, inject, Service } from '@angular/core';
import { WORKING_STATE_STORE } from '../../persistence/working-state-store';
import { PaneTreeService } from '../../regions/pane/tree/pane-tree.service';
import { UnusableWorkspaces } from '../../foundation/unusable-workspaces';
import {
  ActiveWorkspaceService,
  workspaceScopedKey,
} from '../active-workspace.service';
import { CONTENT_DOCK } from '../../regions/pane/tree/pane-address';
import { collectTabs } from '../../regions/pane/tree/pane-queries';
import { ANNOUNCE_UNUSABLE_WORKSPACES } from '../provide-workspaces';
import { PANE_TREES_KEY } from '../workspace-state';
import {
  everyWorkspaceOrigin,
  unusableWorkspaceIds,
} from './workspace-usability';
import { WorkspaceService } from '../workspace.service';

@Service()
export class UnusableWorkspacesService implements UnusableWorkspaces {
  private readonly workspaces = inject(WorkspaceService);
  private readonly active = inject(ActiveWorkspaceService);
  private readonly workingState = inject(WORKING_STATE_STORE);
  private readonly paneTree = inject(PaneTreeService);

  readonly announces = inject(ANNOUNCE_UNUSABLE_WORKSPACES);

  readonly unusable = computed(() =>
    unusableWorkspaceIds({
      workspaces: everyWorkspaceOrigin(
        this.workspaces.definitions,
        this.workspaces.workspaces(),
        (id) => this.workspaces.originOf(id),
      ),
      activeId: this.active.id(),
      activeHasContent:
        collectTabs(this.paneTree.tree(CONTENT_DOCK)).length > 0,
      definitionOf: (id) =>
        this.workspaces.definitions.find(
          (definition) => definition.id === id,
        ),
      storedTrees: (id) =>
        this.workingState.peek?.(workspaceScopedKey(PANE_TREES_KEY, id)),
    }),
  );

  ids(): ReadonlySet<string> {
    return this.unusable();
  }

  announced(): boolean {
    return this.announces && this.unusable().has(this.active.id());
  }
}

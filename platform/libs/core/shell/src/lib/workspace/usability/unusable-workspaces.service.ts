import { computed, inject, Service } from '@angular/core';
import { WORKING_STATE_STORE } from '../../persistence/working-state-store';
import { PaneTreeService } from '../../regions/pane/tree/pane-tree.service';
import { UnusableWorkspaces } from '../../foundation/unusable-workspaces';
import {
  ActiveWorkspaceService,
  workspaceScopedKey,
} from '../active-workspace.service';
import { activeContentPath } from '../active-content-path';
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

  readonly ids = computed(() =>
    unusableWorkspaceIds({
      workspaces: everyWorkspaceOrigin(
        this.workspaces.definitions,
        this.workspaces.workspaces(),
        (id) => this.workspaces.originOf(id),
      ),
      activeId: this.active.id(),
      activeContentPath: activeContentPath(this.paneTree),
      definitionOf: (id) =>
        this.workspaces.definitions.find(
          (definition) => definition.id === id,
        ),
      storedTrees: (id) =>
        this.workingState.peek?.(workspaceScopedKey(PANE_TREES_KEY, id)),
    }),
  );

  announced(): boolean {
    return this.announces && this.ids().has(this.active.id());
  }
}

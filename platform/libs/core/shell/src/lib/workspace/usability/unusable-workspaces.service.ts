import { computed, inject, Service } from '@angular/core';
import { WORKING_STATE_STORE } from '../../persistence/working-state-store';
import { PaneTreeService } from '../../regions/pane/tree/pane-tree.service';
import { UnusableWorkspaces } from './unusable-workspaces';
import {
  ActiveWorkspaceService,
  workspaceScopedKey,
} from '../active-workspace.service';
import { CONTENT_DOCK } from '../../regions/pane/tree/pane-address';
import { collectTabs } from '../../regions/pane/tree/pane-queries';
import { ANNOUNCE_UNUSABLE_WORKSPACES } from '../declaration/provide-workspaces';
import { PANE_TREES_KEY } from '../../regions/pane/tree/pane-tree-storage';
import { unusableWorkspaceIds } from './workspace-usability';
import { WorkspaceCatalog } from '../catalog/workspace-catalog';

@Service()
export class UnusableWorkspacesService implements UnusableWorkspaces {
  private readonly catalog = inject(WorkspaceCatalog);
  private readonly active = inject(ActiveWorkspaceService);
  private readonly workingStateStore = inject(WORKING_STATE_STORE);
  private readonly paneTree = inject(PaneTreeService);

  readonly announcesUnusable = inject(ANNOUNCE_UNUSABLE_WORKSPACES);

  private readonly unusable = computed(() =>
    unusableWorkspaceIds({
      workspaces: this.catalog.everyOrigin(),
      activeId: this.active.id(),
      activeHasContent:
        collectTabs(this.paneTree.tree(CONTENT_DOCK)).length > 0,
      definitionOf: (id) => this.catalog.definitionOf(id),
      storedTrees: (id) =>
        this.workingStateStore.peek?.(workspaceScopedKey(PANE_TREES_KEY, id)),
    }),
  );

  ids(): ReadonlySet<string> {
    return this.unusable();
  }

  announced(): boolean {
    return this.announcesUnusable && this.unusable().has(this.active.id());
  }
}

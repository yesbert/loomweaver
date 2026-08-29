import { inject, Service } from '@angular/core';
import { ContainerSpec, ContainerTabLabel } from '@loomweaver/plugin-sdk';
import { PaneTab } from '../tree/pane-node';
import { findLeafWhere, tabHolderOf } from '../tree/pane-queries';
import { insertTab, setActiveTab } from '../tree/pane-tabs';
import { containerChildPath, containerPathOfDock } from './container-children';
import { containerChildTab, containerLayout } from './container-layout';
import { PaneTreeService } from '../tree/pane-tree.service';

@Service()
export class PaneContainersService {
  private readonly paneTree = inject(PaneTreeService);

  ensureContainer(dock: string, spec: ContainerSpec | undefined): void {
    if (this.paneTree.hasDock(dock)) {
      return;
    }
    const { node } = containerLayout(dock, spec, [], '');
    if (node !== null) {
      const landing = findLeafWhere(node, (leaf) => leaf.declared === true);
      this.paneTree.commit(dock, node, landing?.id);
    }
  }

  dropContainer(dock: string): void {
    this.paneTree.dropDock(dock);
  }

  insertContainerChild(
    dock: string,
    spec: ContainerSpec | undefined,
    paneId: string,
    childId: string,
  ): void {
    this.paneTree.commit(
      dock,
      insertTab(
        this.paneTree.tree(dock),
        paneId,
        containerChildTab(dock, spec, childId),
      ),
    );
  }

  openContainerChild(
    dock: string,
    spec: ContainerSpec | undefined,
    segmentPath: string,
    label?: ContainerTabLabel,
  ): void {
    const path = containerChildPath(containerPathOfDock(dock), segmentPath);
    const tree = this.paneTree.tree(dock);
    const holder = tabHolderOf(tree, path);
    if (holder !== null) {
      this.paneTree.setActiveTab(dock, holder, path);
      return;
    }
    const target = this.paneTree.landingPane(dock);
    this.paneTree.pointAt(dock, target);
    const tab: PaneTab = {
      path,
      instance: `${dock}::${path}`,
      ...(label?.title !== undefined && {
            title: label.title,
            literalTitle: label.titleIsLiteral ?? false,
          }),
      ...(label?.icon !== undefined && { icon: label.icon }),
    };
    this.paneTree.commit(dock, setActiveTab(insertTab(tree, target, tab), target, path));
  }
}

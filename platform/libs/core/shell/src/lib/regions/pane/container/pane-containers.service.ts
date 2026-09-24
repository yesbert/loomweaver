import { inject, isDevMode, Service } from '@angular/core';
import { ContainerSpec, ContainerTabLabel } from '@loomweaver/plugin-sdk';
import { landingLeaf, tabHolderOf } from '../tree/pane-queries';
import { insertTab, setActiveTab } from '../tree/pane-tabs';
import { containerChildPath, containerPathOfDock } from './container-children';
import { containerChildTab, containerLayout } from './container-layout';
import { PaneTreeService } from '../tree/pane-tree.service';
import { LeftOutChildren } from './left-out-children';
import { withLabel } from '../tree/pane-node';

@Service()
export class PaneContainersService {
  private readonly paneTree = inject(PaneTreeService);
  private readonly leftOut = inject(LeftOutChildren);

  ensureContainer(dock: string, spec: ContainerSpec | undefined): void {
    if (this.paneTree.hasDock(dock)) {
      return;
    }
    const { node } = containerLayout(dock, spec, [], '');
    if (node !== null) {
      const landing = landingLeaf(node);
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
    if (this.leftOut.hides(path)) {
      if (isDevMode()) {
        console.warn(
          `Container child "${segmentPath}" is left out and was not opened; bring it back with ctx.setChildShown first.`,
        );
      }
      return;
    }
    const tree = this.paneTree.tree(dock);
    const holder = tabHolderOf(tree, path);
    if (holder !== null) {
      this.paneTree.setActiveTab(dock, holder, path);
      return;
    }
    const target = this.paneTree.landingPane(dock);
    this.paneTree.pointAt(dock, target);
    const tab = withLabel({ path, instance: `${dock}::${path}` }, label ?? {});
    this.paneTree.commit(
      dock,
      setActiveTab(insertTab(tree, target, tab), target, path),
    );
  }
}

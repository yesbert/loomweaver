import { DOCUMENT } from '@angular/common';
import { effect, inject, Injector, Service, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { isPopoutUrl } from '../../../popout/popout-path';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { normalizePath, tabRootOf } from '../../content/content-path';
import { collectTabPaths } from '../tree/pane-queries';
import { PaneChromeService } from '../chrome/pane-chrome.service';
import { CONTAINER_DOCK_PREFIX, isContainerDock } from './container-children';
import { PaneTreeService } from '../tree/pane-tree.service';
import { PaneContainersService } from './pane-containers.service';

@Service()
export class ContainerDockGc {
  private readonly paneTree = inject(PaneTreeService);
  private readonly containers = inject(PaneContainersService);
  private readonly chrome = inject(PaneChromeService);
  private readonly registry = inject(ContributionRegistry);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly popout = isPopoutUrl(
    inject(DOCUMENT).location?.pathname ?? '',
  );
  private started = false;

  start(): void {
    if (this.started || this.popout) {
      return;
    }
    this.started = true;
    effect(
      () => {
        const trees = this.paneTree.dockTrees();
        const containerDocks = Object.keys(trees).filter(isContainerDock);
        if (containerDocks.length === 0) {
          return;
        }
        const open = new Set(
          Object.entries(trees)
            .filter(([dock]) => !isContainerDock(dock))
            .flatMap(([, tree]) => collectTabPaths(tree)),
        );
        untracked(() => {
          const active = tabRootOf(
            this.registry.contentRoutes(),
            normalizePath(this.router.url),
          );
          for (const dock of containerDocks) {
            const contentPath = dock.slice(CONTAINER_DOCK_PREFIX.length);
            if (contentPath === active || open.has(contentPath)) {
              continue;
            }
            this.containers.dropContainer(dock);
            this.chrome.clearMinimized(dock);
          }
        });
      },
      { injector: this.injector },
    );
  }
}

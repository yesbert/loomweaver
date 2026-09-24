import { Component, computed, effect, inject, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterOutlet,
} from '@angular/router';
import { filter, map } from 'rxjs';
import {
  CONTAINER_HANDLE,
  ContainerSpec,
  ContainerTabLabel,
} from '@loomweaver/plugin-sdk';
import { CONTAINER_CONTEXT, ContainerContext } from './container-context';
import { containerChildPath, containerDockFor } from './container-children';
import { LeftOutChildren, shownTree } from './left-out-children';
import { CONTAINER_PANE_OPTIONS } from '../pane-view-options';
import { PaneDragService } from '../drag/pane-drag.service';
import { PaneTreeView } from '../pane-tree-view';
import { PaneTreeService } from '../tree/pane-tree.service';
import { PaneContainersService } from './pane-containers.service';
import { activeTab } from '../tree/pane-node';
import { collectLeafIds, findLeaf } from '../tree/pane-queries';
import { normalizePath, restBelow } from '../../content/content-path';
import { surfaceRouteData } from '../../content/surface/surface-route-data';

@Component({
  selector: 'lw-container-pane-host',
  imports: [PaneTreeView, RouterOutlet],
  providers: [
    PaneDragService,
    {
      provide: CONTAINER_CONTEXT,
      useFactory: (
        route: ActivatedRoute,
        containers: PaneContainersService,
      ) => {
        const spec = surfaceRouteData(route.snapshot.data).container;
        const dock = containerDockFor(
          route.snapshot.url.map((segment) => segment.path).join('/'),
        );
        return {
          params: route.snapshot.params as Record<string, string>,
          spec,
          open: (segmentPath: string, label?: ContainerTabLabel) =>
            containers.openContainerChild(dock, spec, segmentPath, label),
        };
      },
      deps: [ActivatedRoute, PaneContainersService],
    },
    {
      provide: CONTAINER_HANDLE,
      useFactory: (ctx: ContainerContext) => ({ open: ctx.open }),
      deps: [CONTAINER_CONTEXT],
    },
  ],
  host: { class: 'flex min-h-0 min-w-0 flex-1' },
  templateUrl: './container-pane-host.html',
})
export class ContainerPaneHost {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly paneTree = inject(PaneTreeService);
  private readonly containers = inject(PaneContainersService);
  private readonly leftOut = inject(LeftOutChildren);

  protected readonly paneOptions = CONTAINER_PANE_OPTIONS;
  protected readonly dock: string;
  protected readonly tree = computed(
    () =>
      shownTree(this.paneTree.tree(this.dock), (path) =>
        this.leftOut.hides(path),
      ) ?? {
        kind: 'leaf' as const,
        id: this.paneTree.primaryId(this.dock),
        tabs: [],
      },
  );

  private readonly containerPath: string;
  private readonly spec: ContainerSpec | undefined;

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  private readonly urlSegment = computed(() => {
    const url = normalizePath(this.currentUrl());
    const holdsUrl =
      url === this.containerPath || url.startsWith(`${this.containerPath}/`);
    return holdsUrl ? restBelow(this.containerPath, url) : null;
  });

  private readonly focusedSegment = computed(() => {
    const tree = this.tree();
    const leaf =
      findLeaf(tree, this.paneTree.primaryId(this.dock)) ??
      findLeaf(tree, collectLeafIds(tree)[0] ?? '');
    const path = leaf ? activeTab(leaf)?.path : undefined;
    return path === undefined
      ? ''
      : restBelow(this.containerPath, normalizePath(path));
  });

  constructor() {
    this.containerPath = this.route.snapshot.url
      .map((segment) => segment.path)
      .join('/');
    this.dock = containerDockFor(this.containerPath);
    this.spec = surfaceRouteData(this.route.snapshot.data).container;
    this.containers.ensureContainer(this.dock, this.spec);
    this.followUrl();
    this.leadUrl();
  }

  private followUrl(): void {
    effect(() => {
      const segment = this.urlSegment();
      if (
        !segment ||
        segment === untracked(() => this.focusedSegment()) ||
        this.leftOut.hides(containerChildPath(this.containerPath, segment))
      ) {
        return;
      }
      untracked(() =>
        this.containers.openContainerChild(this.dock, this.spec, segment),
      );
    });
  }

  private leadUrl(): void {
    effect(() => {
      const segment = this.focusedSegment();
      const url = this.urlSegment();
      if (url === null || url === segment) {
        return;
      }
      const target = segment
        ? `/${this.containerPath}/${segment}`
        : `/${this.containerPath}`;
      void this.router.navigateByUrl(target).catch(() => undefined);
    });
  }
}

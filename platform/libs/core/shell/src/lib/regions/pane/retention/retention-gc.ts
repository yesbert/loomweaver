import { DOCUMENT } from '@angular/common';
import { effect, inject, Injector, Service, untracked } from '@angular/core';
import { ContentRoute, View } from '@loomweaver/plugin-sdk';
import { isPopoutUrl } from '../../../popout/popout-path';
import { ActiveWorkspaceService } from '../../../workspace/active-workspace.service';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { NotificationService } from '../../../notifications/notification.service';
import { ContentReuseStrategy } from '../../content/routing/content-reuse-strategy';
import { tabRootOf } from '../../content/content-path';
import { PaneNode } from '../tree/pane-node';
import { PaneTreeService } from '../tree/pane-tree.service';
import { RetainedViewStash } from './retained-view-stash';
import {
  PRIMARY_RETENTION_PREFIX,
  dirtySurfaceOf,
  instanceDirty,
  paneRetentionScope,
  resolvableSurfacePath,
  saveOnHidePath,
} from './retention-policy';

interface ParkedInstance {
  readonly instance?: unknown;
  readonly retained: boolean;
  readonly path: string;
  readonly dirty: boolean;
  readonly evict: () => void;
  readonly tabLive: boolean;
  readonly parkedElsewhere: boolean;
}

@Service()
export class RetentionGc {
  private readonly paneTree = inject(PaneTreeService);
  private readonly registry = inject(ContributionRegistry);
  private readonly stash = inject(RetainedViewStash);
  private readonly reuse = inject(ContentReuseStrategy);
  private readonly notifications = inject(NotificationService);
  private readonly injector = inject(Injector);
  private readonly workspace = inject(ActiveWorkspaceService);
  private readonly popout = isPopoutUrl(
    inject(DOCUMENT).location?.pathname ?? '',
  );
  private autoSaved = new Set<unknown>();
  private started = false;

  start(): void {
    if (this.started || this.popout) {
      return;
    }
    this.started = true;
    effect(
      () => {
        this.stash.version();
        this.reuse.version();
        const trees = this.paneTree.dockTrees();
        const routes = this.registry.contentRoutes();
        const views = this.registry.views();
        const open = openPathsByScope(trees);
        const active = this.workspace.id();
        const parked = [
          ...this.parkedStash(open, routes, views, active),
          ...this.parkedHandles(),
        ];
        untracked(() => this.settle(parked, routes, views));
      },
      { injector: this.injector },
    );
  }

  private parkedStash(
    open: Map<string, Set<string>>,
    routes: readonly ContentRoute[],
    views: readonly View[],
    active: string,
  ): ParkedInstance[] {
    return this.stash.parked().map((entry) => ({
      instance: entry.instance,
      retained: entry.retained,
      path: pathOfKey(entry.key),
      dirty: instanceDirty(entry.instance),
      evict: () => this.stash.evictParked(entry.key),
      tabLive: stashKeyLive(entry.key, open, routes, views),
      parkedElsewhere: entry.workspace !== active,
    }));
  }

  private parkedHandles(): ParkedInstance[] {
    return this.reuse.parkedHandles().map((handle) => ({
      instance: handle.instance,
      retained: false,
      path: handle.key,
      dirty: instanceDirty(handle.instance),
      evict: () => this.reuse.evict(handle.key),
      tabLive: true,
      parkedElsewhere: false,
    }));
  }

  private settle(
    parked: readonly ParkedInstance[],
    routes: readonly ContentRoute[],
    views: readonly View[],
  ): void {
    const stillParked = new Set(parked.map((entry) => entry.instance));
    this.autoSaved = new Set(
      [...this.autoSaved].filter((instance) => stillParked.has(instance)),
    );
    for (const entry of parked) {
      if (!entry.tabLive && !entry.parkedElsewhere) {
        entry.evict();
        continue;
      }
      if (entry.dirty) {
        this.autoSaveOnce(entry, routes, views);
        continue;
      }
      if (!entry.retained) {
        entry.evict();
      }
    }
  }

  private autoSaveOnce(
    entry: ParkedInstance,
    routes: readonly ContentRoute[],
    views: readonly View[],
  ): void {
    if (
      this.autoSaved.has(entry.instance) ||
      !saveOnHidePath(routes, views, entry.path)
    ) {
      return;
    }
    const save = dirtySurfaceOf(entry.instance)?.surfaceSave;
    if (!save) {
      return;
    }
    this.autoSaved.add(entry.instance);
    save.call(entry.instance).catch((error: unknown) => {
      console.error('saveOn:hide failed — the surface stays dirty', error);
      this.notifications.show({
        message: 'retention.saveFailed',
        kind: 'warning',
      });
    });
  }
}

function pathOfKey(key: string): string {
  return key.split('|', 2)[1] ?? '';
}

function stashKeyLive(
  key: string,
  open: Map<string, Set<string>>,
  routes: readonly ContentRoute[],
  views: readonly View[],
): boolean {
  if (key.startsWith(PRIMARY_RETENTION_PREFIX)) {
    return true;
  }
  const [scope, path] = key.split('|', 2);
  if (!tabOpen(open.get(scope), routes, path)) {
    return false;
  }
  return resolvableSurfacePath(routes, views, path);
}

function tabOpen(
  paths: ReadonlySet<string> | undefined,
  routes: readonly ContentRoute[],
  path: string,
): boolean {
  if (!paths) {
    return false;
  }
  return (
    paths.has(path) ||
    [...paths].some((open) => tabRootOf(routes, open) === path)
  );
}

function openPathsByScope(
  trees: Record<string, PaneNode>,
): Map<string, Set<string>> {
  const open = new Map<string, Set<string>>();
  for (const [dock, tree] of Object.entries(trees)) {
    collectLeafPaths(dock, tree, open);
  }
  return open;
}

function collectLeafPaths(
  dock: string,
  node: PaneNode,
  open: Map<string, Set<string>>,
): void {
  if (node.kind === 'split') {
    collectLeafPaths(dock, node.first, open);
    collectLeafPaths(dock, node.second, open);
    return;
  }
  const scope = paneRetentionScope(dock, node.id);
  let paths = open.get(scope);
  if (!paths) {
    paths = new Set<string>();
    open.set(scope, paths);
  }
  for (const tab of node.tabs) {
    paths.add(tab.path);
  }
}

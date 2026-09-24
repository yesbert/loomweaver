import { effect, inject, Injector, Service, untracked } from '@angular/core';
import { ContentRoute, View } from '@loomweaver/plugin-sdk';
import { PopoutWindow } from '../../../popout/popout-window';
import { ActiveWorkspaceService } from '../../../workspace/active-workspace.service';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { NotificationService } from '../../../notifications/notification.service';
import { tabRootOf } from '../../content/content-path';
import { PaneNode } from '../tree/pane-node';
import { leavesOf } from '../tree/pane-queries';
import { PaneTreeService } from '../tree/pane-tree.service';
import { RetainedViewStash } from './retained-view-stash';
import { resolvableSurfacePath, saveOnHidePath } from './retention-policy';
import { dirtySurfaceOf, instanceDirty } from '../unsaved-work/dirty-surface';
import {
  isPrimaryRetentionKey,
  paneRetentionScope,
  pathOfRetentionKey,
  scopeOfRetentionKey,
} from './retention-keys';

interface ParkedInstance {
  readonly instance?: unknown;
  readonly retains: boolean;
  readonly held: boolean;
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
  private readonly notifications = inject(NotificationService);
  private readonly injector = inject(Injector);
  private readonly workspace = inject(ActiveWorkspaceService);
  private readonly popout = inject(PopoutWindow).active;
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
        const trees = this.paneTree.dockTrees();
        const routes = this.registry.contentRoutes();
        const views = this.registry.views();
        const open = openPathsByScope(trees);
        const active = this.workspace.id();
        const parked = this.parkedStash(open, routes, views, active);
        untracked(() => this.sweep(parked, routes, views));
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
      retains: entry.retains,
      held: entry.held,
      path: pathOfRetentionKey(entry.key),
      dirty: instanceDirty(entry.instance),
      evict: () => this.stash.evictParked(entry.key),
      tabLive:
        stashKeyLive(entry.key, open, routes, views) ||
        (entry.held &&
          openAnywhere(pathOfRetentionKey(entry.key), open, routes)),
      parkedElsewhere: entry.workspace !== active,
    }));
  }

  private sweep(
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
      if (!entry.retains && !entry.held) {
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

function stashKeyLive(
  key: string,
  open: Map<string, Set<string>>,
  routes: readonly ContentRoute[],
  views: readonly View[],
): boolean {
  if (isPrimaryRetentionKey(key)) {
    return true;
  }
  const path = pathOfRetentionKey(key);
  if (!tabOpen(open.get(scopeOfRetentionKey(key)), routes, path)) {
    return false;
  }
  return resolvableSurfacePath(routes, views, path);
}

function openAnywhere(
  path: string,
  open: Map<string, Set<string>>,
  routes: readonly ContentRoute[],
): boolean {
  return [...open.values()].some((paths) => tabOpen(paths, routes, path));
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
    for (const leaf of leavesOf(tree)) {
      const scope = paneRetentionScope(dock, leaf.id);
      const paths = open.get(scope) ?? new Set<string>();
      for (const tab of leaf.tabs) {
        paths.add(tab.path);
      }
      open.set(scope, paths);
    }
  }
  return open;
}

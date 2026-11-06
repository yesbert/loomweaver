import { effect, inject, Injector, Service, untracked } from '@angular/core';
import { ContentRoute, View } from '@loomweaver/plugin-sdk';
import { ActiveWorkspaceService } from '../../../workspace/active-workspace.service';
import { ContributionRegistry } from '../../../contributions/contribution-registry';
import { tabRootOf } from '../../content/content-path';
import { PaneTreeService } from '../tree/pane-tree.service';
import { openPathsByScope } from './open-tabs';
import { RetainedViewStash } from './retained-view-stash';
import { resolvableSurfacePath } from './retention-policy';
import { instanceDirty } from '../unsaved-work/dirty-surface';
import { SaveOnHide } from '../unsaved-work/save-on-hide';
import {
  isPrimaryRetentionKey,
  pathOfRetentionKey,
  scopeOfRetentionKey,
} from './retention-keys';

interface ParkedInstance {
  readonly key: string;
  readonly instance?: unknown;
  readonly retains: boolean;
  readonly held: boolean;
  readonly path: string;
  readonly dirty: boolean;
  readonly tabLive: boolean;
  readonly parkedElsewhere: boolean;
}

@Service()
export class ParkedViewSweep {
  private readonly paneTree = inject(PaneTreeService);
  private readonly registry = inject(ContributionRegistry);
  private readonly stash = inject(RetainedViewStash);
  private readonly saveOnHide = inject(SaveOnHide);
  private readonly injector = inject(Injector);
  private readonly workspace = inject(ActiveWorkspaceService);
  private started = false;

  start(): void {
    if (this.started) {
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
      key: entry.key,
      instance: entry.instance,
      retains: entry.retains,
      held: entry.held,
      path: pathOfRetentionKey(entry.key),
      dirty: instanceDirty(entry.instance),
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
    this.saveOnHide.forgetAllBut(
      new Set(parked.map((entry) => entry.instance)),
    );
    for (const entry of parked) {
      if (!entry.tabLive && !entry.parkedElsewhere) {
        this.stash.evictParked(entry.key);
        continue;
      }
      if (entry.dirty) {
        this.saveOnHide.saveOnce(entry.instance, entry.path, routes, views);
        continue;
      }
      if (!entry.retains && !entry.held) {
        this.stash.evictParked(entry.key);
      }
    }
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

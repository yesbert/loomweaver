import { inject, Service } from '@angular/core';
import { ChildrenOutletContexts, Router } from '@angular/router';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { ContentReuseStrategy } from '../../content/routing/content-reuse-strategy';
import { matchRoute, normalizePath } from '../../content/content-path';
import { VIEW_PANE_PREFIX } from '../tree/pane-address';
import { RetainedViewStash } from './retained-view-stash';

@Service()
export class RetentionCandidates {
  private readonly stash = inject(RetainedViewStash);
  private readonly reuse = inject(ContentReuseStrategy);
  private readonly outletContexts = inject(ChildrenOutletContexts);
  private readonly router = inject(Router);
  private readonly registry = inject(ContributionRegistry);

  all(): unknown[] {
    return [
      ...this.stash.instances(),
      ...this.parkedInstances(() => true),
      ...this.activeOutletInstance(() => true),
    ];
  }

  ofPlugin(pluginId: string): unknown[] {
    const owns = this.pathOwnership(pluginId);
    return [
      ...this.stash
        .keyedInstances()
        .filter((entry) => owns(pathOfStashKey(entry.key)))
        .map((entry) => entry.instance),
      ...this.parkedInstances(owns),
      ...this.activeOutletInstance(owns),
    ];
  }

  private parkedInstances(owns: (path: string) => boolean): unknown[] {
    return this.reuse
      .parkedHandles()
      .filter((handle) => handle.instance !== undefined && owns(handle.key))
      .map((handle) => handle.instance);
  }

  private activeOutletInstance(owns: (path: string) => boolean): unknown[] {
    const outlet = this.outletContexts.getContext('primary')?.outlet;
    if (outlet?.isActivated !== true) {
      return [];
    }
    return owns(normalizePath(this.router.url)) ? [outlet.component] : [];
  }

  private pathOwnership(pluginId: string): (path: string) => boolean {
    const routes = this.registry
      .contentRoutes()
      .filter((route) => route.pluginId === pluginId);
    const viewIds = new Set(
      this.registry
        .views()
        .filter((view) => view.pluginId === pluginId)
        .map((view) => view.id),
    );
    return (path) => {
      if (path === '') {
        return false;
      }
      if (path.startsWith(VIEW_PANE_PREFIX)) {
        return viewIds.has(path.slice(VIEW_PANE_PREFIX.length));
      }
      return matchRoute(routes, path) !== undefined;
    };
  }
}

function pathOfStashKey(key: string): string {
  return key.split('|')[1] ?? '';
}

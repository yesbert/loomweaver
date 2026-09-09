import { inject, Service } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ChildrenOutletContexts, NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { ContentReuseStrategy } from '../../content/routing/content-reuse-strategy';
import { normalizePath, tabRootOf } from '../../content/content-path';
import { CONTENT_DOCK, VIEW_PANE_PREFIX } from '../tree/pane-address';
import { PaneTreeService } from '../tree/pane-tree.service';
import { RetainedViewStash } from './retained-view-stash';
import {
  containerChildInstances,
  instanceDirty,
  paneRetentionScope,
} from './retention-policy';

@Service()
export class UnsavedWork {
  private readonly stash = inject(RetainedViewStash);
  private readonly reuse = inject(ContentReuseStrategy);
  private readonly registry = inject(ContributionRegistry);
  private readonly paneTree = inject(PaneTreeService);
  private readonly router = inject(Router);
  private readonly outletContexts = inject(ChildrenOutletContexts);

  private readonly activeUrl = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  instancesAt(scope: string, path: string): unknown[] {
    this.stash.version();
    const keyed = this.stash.keyedInstances();
    const addresses = this.addressesOf(path);
    return [
      ...new Set([
        ...addresses.flatMap((address) =>
          this.stash.instancesFor(scope, address),
        ),
        ...addresses.flatMap((address) =>
          containerChildInstances(keyed, address),
        ),
        ...this.routedInstances(scope, addresses.at(-1) ?? path),
      ]),
    ];
  }

  at(scope: string, path: string): boolean {
    return this.instancesAt(scope, path).some((instance) =>
      instanceDirty(instance),
    );
  }

  anywhere(path: string): boolean {
    return this.instancesAnywhere(path).some((instance) =>
      instanceDirty(instance),
    );
  }

  private instancesAnywhere(path: string): unknown[] {
    this.stash.version();
    const keyed = this.stash.keyedInstances();
    const addresses = this.addressesOf(path);
    const named = new Set(addresses);
    return [
      ...new Set([
        ...keyed
          .filter((entry) => named.has(pathOfKey(entry.key)))
          .map((entry) => entry.instance),
        ...addresses.flatMap((address) =>
          containerChildInstances(keyed, address),
        ),
        ...this.routedInstances(this.contentScope(), addresses.at(-1) ?? path),
      ]),
    ];
  }

  private contentScope(): string {
    return paneRetentionScope(CONTENT_DOCK, this.paneTree.primaryId(CONTENT_DOCK));
  }

  private addressesOf(path: string): string[] {
    if (path.startsWith(VIEW_PANE_PREFIX)) {
      return [path];
    }
    const normalized = normalizePath(path);
    const root = tabRootOf(this.registry.contentRoutes(), normalized);
    return root === normalized ? [normalized] : [normalized, root];
  }

  private activeAddress(): string {
    return tabRootOf(
      this.registry.contentRoutes(),
      normalizePath(this.activeUrl()),
    );
  }

  private routedInstances(scope: string, address: string): unknown[] {
    if (address.startsWith(VIEW_PANE_PREFIX) || scope !== this.contentScope()) {
      return [];
    }
    this.reuse.version();
    const found: unknown[] = [];
    if (this.activeAddress() === address) {
      const outlet = this.outletContexts.getContext('primary')?.outlet;
      if (outlet?.isActivated === true) {
        found.push(outlet.component);
      }
    }
    const parked = this.reuse
      .parkedHandles()
      .find((handle) => handle.key === address);
    if (parked?.instance !== undefined) {
      found.push(parked.instance);
    }
    return found;
  }
}

function pathOfKey(key: string): string {
  return key.split('|')[1] ?? '';
}

import { inject, Service } from '@angular/core';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { normalizePath, tabRootOf } from '../../content/content-path';
import { isViewPanePath } from '../tree/pane-address';
import { RetainedViewStash } from '../retention/retained-view-stash';
import { instanceDirty } from './dirty-surface';
import {
  containerChildInstances,
  pathOfRetentionKey,
} from '../retention/retention-keys';

@Service()
export class UnsavedWork {
  private readonly stash = inject(RetainedViewStash);
  private readonly registry = inject(ContributionRegistry);

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
          .filter((entry) => named.has(pathOfRetentionKey(entry.key)))
          .map((entry) => entry.instance),
        ...addresses.flatMap((address) =>
          containerChildInstances(keyed, address),
        ),
      ]),
    ];
  }

  private addressesOf(path: string): string[] {
    if (isViewPanePath(path)) {
      return [path];
    }
    const normalized = normalizePath(path);
    const root = tabRootOf(this.registry.contentRoutes(), normalized);
    return root === normalized ? [normalized] : [normalized, root];
  }
}

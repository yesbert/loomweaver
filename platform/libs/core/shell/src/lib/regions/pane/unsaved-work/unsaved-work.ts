import { inject, Service } from '@angular/core';
import { ContributionRegistry } from '../../../contributions/contribution-registry';
import { pathOwnedBy } from '../../../plugin/context/plugin-surface-ownership';
import { RetainedViewStash } from '../retention/retained-view-stash';
import { DockTrees, tabDepartures } from '../retention/tree-retention';
import { instanceDirty } from './dirty-surface';
import {
  containerChildInstances,
  pathOfRetentionKey,
  retainedAddressesOf,
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

  lostBy(before: DockTrees, after: DockTrees): unknown[] {
    const lost = tabDepartures(before, after).flatMap((tab) =>
      tab.to === null
        ? this.instancesAt(tab.from, tab.path)
        : this.addressesOf(tab.path).flatMap((address) =>
            this.stash.uncarriableAt(tab.from, address),
          ),
    );
    return [...new Set(lost)].filter((instance) => instanceDirty(instance));
  }

  instancesEverywhere(): unknown[] {
    return this.stash.instances();
  }

  instancesOfPlugin(pluginId: string): unknown[] {
    const owns = pathOwnedBy(this.registry, pluginId);
    return this.stash
      .keyedInstancesEverywhere()
      .filter((entry) => owns(pathOfRetentionKey(entry.key)))
      .map((entry) => entry.instance);
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
    return retainedAddressesOf(this.registry.contentRoutes(), path);
  }
}

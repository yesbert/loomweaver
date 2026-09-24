import { inject, Service } from '@angular/core';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { pathOwnedBy } from '../../../plugin/plugin-surface-ownership';
import { RetainedViewStash } from './retained-view-stash';
import { pathOfRetentionKey } from './retention-keys';

@Service()
export class RetentionCandidates {
  private readonly stash = inject(RetainedViewStash);
  private readonly registry = inject(ContributionRegistry);

  all(): unknown[] {
    return this.stash.instances();
  }

  ofPlugin(pluginId: string): unknown[] {
    const owns = this.pathOwnership(pluginId);
    return this.stash
      .keyedInstances()
      .filter((entry) => owns(pathOfRetentionKey(entry.key)))
      .map((entry) => entry.instance);
  }

  private pathOwnership(pluginId: string): (path: string) => boolean {
    return pathOwnedBy(this.registry, pluginId);
  }
}

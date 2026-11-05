import { inject, Service, signal, untracked } from '@angular/core';
import { ContributionRegistry } from '../contributions/contribution-registry';
import { declaringRoute } from '../regions/content/content-path';

interface LostAddress {
  readonly pluginId: string;
  readonly path: string;
}

@Service()
export class FailedPluginContent {
  private readonly registry = inject(ContributionRegistry);

  private readonly lost = signal<readonly LostAddress[]>([]);

  rememberContentOf(pluginId: string): void {
    const paths = untracked(() => this.registry.contentRoutes())
      .filter((route) => route.pluginId === pluginId)
      .map((route) => ({ pluginId, path: route.path }));
    this.lost.update((lost) => [...withoutPlugin(lost, pluginId), ...paths]);
  }

  forget(pluginId: string): void {
    this.lost.update((lost) => withoutPlugin(lost, pluginId));
  }

  holds(path: string): boolean {
    return declaringRoute(this.lost(), path) !== undefined;
  }
}

function withoutPlugin(
  lost: readonly LostAddress[],
  pluginId: string,
): readonly LostAddress[] {
  return lost.some((address) => address.pluginId === pluginId)
    ? lost.filter((address) => address.pluginId !== pluginId)
    : lost;
}

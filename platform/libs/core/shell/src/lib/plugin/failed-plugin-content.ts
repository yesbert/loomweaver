import { inject, Service, signal, untracked } from '@angular/core';
import { ContributionRegistry } from '../contributions/contribution-registry';
import { declaringRoute } from '../regions/content/content-path';
import { isViewPanePath } from '../regions/pane/tree/pane-address';

export interface PluginRecovery {
  readonly name: string;
  readonly retry: () => void;
}

interface LostAddress {
  readonly pluginId: string;
  readonly path: string;
  readonly recovery?: PluginRecovery;
}

@Service()
export class FailedPluginContent {
  private readonly registry = inject(ContributionRegistry);

  private readonly lost = signal<readonly LostAddress[]>([]);

  rememberContentOf(pluginId: string): void {
    const paths = untracked(() => this.registry.contentRoutes())
      .filter((route) => route.pluginId === pluginId)
      .map((route) => route.path);
    this.remember(pluginId, paths);
  }

  rememberAddresses(
    pluginId: string,
    addresses: readonly string[],
    recovery: PluginRecovery,
  ): void {
    this.remember(pluginId, addresses, recovery);
  }

  forget(pluginId: string): void {
    this.lost.update((lost) => withoutPlugin(lost, pluginId));
  }

  holds(path: string): boolean {
    return this.lostAt(path) !== undefined;
  }

  recoveryFor(path: string): PluginRecovery | undefined {
    return this.lostAt(path)?.recovery;
  }

  private remember(
    pluginId: string,
    paths: readonly string[],
    recovery?: PluginRecovery,
  ): void {
    const addresses = paths.map((path) => ({ pluginId, path, recovery }));
    this.lost.update((lost) => [...withoutPlugin(lost, pluginId), ...addresses]);
  }

  private lostAt(path: string): LostAddress | undefined {
    const lost = this.lost();
    return isViewPanePath(path)
      ? lost.find((address) => address.path === path)
      : declaringRoute(
          lost.filter((address) => !isViewPanePath(address.path)),
          path,
        );
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

import {
  effect,
  EnvironmentInjector,
  inject,
  Service,
  untracked,
} from '@angular/core';
import { Disposable, Surface } from '@loomweaver/plugin-sdk';
import {
  ContributionRegistry,
  RegisteredContentRoute,
} from '../../contributions/contribution-registry';
import { PluginIsolationLevelService } from '../../plugin-isolation/plugin-isolation-level.service';
import { liesUnder, nestingRefused } from '../context/surface-admission';

interface HeldAddress {
  readonly pluginId: string;
  readonly path: string;
  readonly registration: Disposable;
}

@Service()
export class FrameAddressPrecedence {
  private readonly registry = inject(ContributionRegistry);

  private readonly isolation = inject(PluginIsolationLevelService);

  private readonly injector = inject(EnvironmentInjector);

  private held: readonly HeldAddress[] = [];

  private watching = false;

  hold(pluginId: string, surface: Surface, registration: Disposable): void {
    if (!surface.routable) {
      return;
    }
    const path = surface.routable.path;
    this.held = [
      ...this.held.filter(
        (address) => address.pluginId !== pluginId || address.path !== path,
      ),
      { pluginId, path, registration },
    ];
    this.watch();
  }

  release(pluginId: string): void {
    this.held = this.held.filter((address) => address.pluginId !== pluginId);
  }

  private watch(): void {
    if (this.watching) {
      return;
    }
    this.watching = true;
    effect(
      () => {
        const routes = this.registry.contentRoutes();
        untracked(() => this.yieldUnder(routes));
      },
      { injector: this.injector },
    );
  }

  private yieldUnder(routes: readonly RegisteredContentRoute[]): void {
    for (const address of this.held) {
      const owner = routes.find(
        (route) =>
          this.runsAsOwnCode(route.pluginId) &&
          liesUnder(address.path, route.path),
      );
      if (owner === undefined) {
        continue;
      }
      console.warn(
        nestingRefused(
          address.path,
          owner.path,
          owner.pluginId,
          address.pluginId,
          'withdrawn',
        ),
      );
      this.held = this.held.filter((other) => other !== address);
      address.registration.dispose();
    }
  }

  private runsAsOwnCode(pluginId: string | undefined): boolean {
    return pluginId === undefined || this.isolation.rungOf(pluginId) === 'trusted';
  }
}

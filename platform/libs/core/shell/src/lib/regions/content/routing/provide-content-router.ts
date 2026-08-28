import {
  EnvironmentProviders,
  Provider,
  inject,
  provideAppInitializer,
} from '@angular/core';
import {
  RouteReuseStrategy,
  Routes,
  provideRouter,
  withDisabledInitialNavigation,
} from '@angular/router';
import { ContentRouter } from './content-router';
import { ContentReuseStrategy } from './content-reuse-strategy';
import { ContainerDockGc } from '../../pane/container/container-dock-gc';
import { RetentionGc } from '../../pane/retention/retention-gc';
import { RetentionUnloadGuard } from '../../pane/retention/retention-unload-guard';
import { ContainerPaneHost } from '../../pane/container/container-pane-host';
import { CONTAINER_PANE_HOST } from '../../pane/container/container-context';

/**
 * The distribution's router, set up for the content area — call this **instead of**
 * `provideRouter([])`. It bundles the three pieces that make plugin-contributed content routes work
 * as one foolproof unit, so a distribution author cannot forget the initial-navigation flag:
 *
 * - `withDisabledInitialNavigation()` — the router does not navigate until the plugin routes exist.
 * - `ContentReuseStrategy` — keeps a surface's instance across tab/perspective switches when its
 *   retention policy says so (`retain: 'always'` or a `retention: 'retain'` default).
 * - an app-initializer that runs {@link ContentRouter.start} after plugins activate: it mirrors the
 *   registered content routes into the router and then performs the deferred initial navigation.
 *
 * Pass `extraRoutes` for any non-content routes the distribution owns.
 */
export function provideShellRouter(
  extraRoutes: Routes = [],
): (Provider | EnvironmentProviders)[] {
  return [
    provideRouter([...extraRoutes], withDisabledInitialNavigation()),

    { provide: RouteReuseStrategy, useExisting: ContentReuseStrategy },
    { provide: CONTAINER_PANE_HOST, useValue: ContainerPaneHost },
    provideAppInitializer(() => {
      inject(ContentRouter).start();
      inject(ContainerDockGc).start();
      inject(RetentionGc).start();
      inject(RetentionUnloadGuard).start();
    }),
  ];
}

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
import { DISTRIBUTION_ROUTES } from './distribution-routes';
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
 * Pass `extraRoutes` for any non-content routes the distribution owns — a redirect for the address
 * that names no content, a legal page, a sign-in page. They stay reachable for the life of the
 * application: the shell rebuilds the route table whenever the contributed routes change and puts
 * them back each time, before the contributed ones, so a distribution can correct an address a
 * plugin also declares (the developer is told in development). A catch-all among them is placed
 * last, so a page for addresses that name nothing cannot swallow the plugins' own. A route the
 * distribution owns opens no content tab.
 */
export function provideShellRouter(
  extraRoutes: Routes = [],
): (Provider | EnvironmentProviders)[] {
  return [
    provideRouter([...extraRoutes], withDisabledInitialNavigation()),
    { provide: DISTRIBUTION_ROUTES, useValue: extraRoutes },

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

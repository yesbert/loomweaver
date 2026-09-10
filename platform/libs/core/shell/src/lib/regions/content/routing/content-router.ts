import { Location } from '@angular/common';
import {
  effect,
  inject,
  Injector,
  isDevMode,
  Service,
  untracked,
} from '@angular/core';
import { NavigationEnd, Route, Router, Routes } from '@angular/router';
import { filter } from 'rxjs';
import { ContentRoute } from '@loomweaver/plugin-sdk';
import {
  ContributionRegistry,
  RegisteredContentRoute,
} from '../../../plugin/contribution-registry';
import { AuthContext } from '../../../auth/auth-context';
import { ContainerPaneHost } from '../../pane/container/container-pane-host';
import { ContentSubStub } from './content-sub-stub';
import { SurfaceRouteStub } from './surface-route-stub';
import { AuthRequiredView } from '../access/auth-required-view';
import { RouteUnavailableView } from '../access/route-unavailable-view';
import { accessCanMatch } from '../access/content-access';
import { BootAddress } from './boot-address';
import { DISTRIBUTION_ROUTES, isCatchAll } from './distribution-routes';
import { ContentReuseStrategy } from './content-reuse-strategy';
import { keepPopout } from './keep-popout.guard';
import { settleWorkspace } from './settle-workspace.guard';
import {
  RetentionDefault,
  routeRetains,
  SURFACE_RETENTION,
} from '../../pane/retention/retention-policy';
import { containerChildren } from '../../pane/container/container-children';
import { matchRoute, normalizePath, segmentsOf } from '../content-path';
import { POPOUT_PREFIX } from '../../../popout/popout-path';
import { PopoutView } from '../../../popout/popout-view';

export function buildContentRoutes(
  contentRoutes: readonly RegisteredContentRoute[],
  omitted: readonly ContentRoute[] = [],
  retention: RetentionDefault = 'destroy',
): Routes {
  const placeholders: Routes = omitted.map((route) => ({
    path: route.path,
    component: RouteUnavailableView,
    canActivate: [keepPopout, settleWorkspace],
    data: { content: true, routePlaceholder: true },
  }));
  return [...buildRegisteredRoutes(contentRoutes, retention), ...placeholders];
}

function surfaceRoute(
  route: RegisteredContentRoute,
  retained: boolean,
): Partial<Route> {
  if (route.container !== undefined) {
    return { component: ContainerPaneHost };
  }
  if (route.iframe !== undefined || retained) {
    return { component: SurfaceRouteStub };
  }
  return route.loadComponent
    ? { loadComponent: route.loadComponent }
    : { component: route.component };
}

function subStub(path: string, pathMatch?: 'full'): Route {
  return {
    path,
    ...(pathMatch && { pathMatch }),
    component: ContentSubStub,
    data: { content: true, sub: true },
  };
}

function containerSubs(route: RegisteredContentRoute): readonly string[] {
  return containerChildren(route.container)
    .map((child) => child.segment)
    .filter((segment): segment is string => segment !== undefined);
}

function childRoutes(route: RegisteredContentRoute): Routes {
  const subs = [...(route.subRoutes ?? []), ...containerSubs(route)];
  const children: Routes = subs.map((sub) => subStub(sub));
  if (subs.length) {
    children.unshift(subStub('', 'full'));
  }
  if (route.rest === true) {
    children.push(subStub('**'));
  }
  return children;
}

function buildRegisteredRoutes(
  contentRoutes: readonly RegisteredContentRoute[],
  retention: RetentionDefault,
): Routes {
  return contentRoutes.flatMap((route) => {
    const retained = routeRetains(route, retention);
    const angular: Route = {
      path: route.path,
      ...surfaceRoute(route, retained),
      canActivate: [keepPopout, settleWorkspace],
      data: {
        content: true,
        chromeless: route.chromeless,
        iframe: route.iframe,
        container: route.container,
        pluginId: route.pluginId,
        retain: retained,
      },
    };
    const children = childRoutes(route);
    if (children.length) {
      angular.children = children;
    }

    if (route.access) {
      angular.canMatch = [accessCanMatch(route.access)];
      const placeholder: Route = {
        path: route.path,
        component: AuthRequiredView,
        canActivate: [keepPopout],
        data: {
          content: true,
          authPlaceholder: true,
          chromeless: route.chromeless,
        },
      };
      return [angular, placeholder];
    }
    return [angular];
  });
}

@Service()
export class ContentRouter {
  private readonly registry = inject(ContributionRegistry);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly bootAddress = inject(BootAddress);
  private readonly injector = inject(Injector);
  private readonly reuse = inject(ContentReuseStrategy);
  private readonly auth = inject(AuthContext);
  private readonly retention = inject(SURFACE_RETENTION);
  private readonly owned =
    inject(DISTRIBUTION_ROUTES, { optional: true }) ?? [];
  private readonly ownedFirst = this.owned.filter(
    (route) => !isCatchAll(route),
  );
  private readonly ownedLast = this.owned.filter((route) => isCatchAll(route));
  private readonly reportedTwice = new Set<string>();
  private started = false;
  private lastRoutes: readonly ContentRoute[] = [];
  private lastOmitted: readonly ContentRoute[] = [];

  private pendingDeepLink: string | null = null;
  private heldAddress: string | null = null;
  private parkedOnPlaceholder = false;
  private userNavigated = false;
  private landings = 0;
  private heldAt = 0;

  here(): string {
    return normalizePath(this.router.url);
  }

  hold(address: string): void {
    this.heldAddress = normalizePath(address) === '' ? null : address;
    this.heldAt = this.landings;
  }

  start(): void {
    if (this.started) {
      return;
    }
    this.started = true;

    const deepLink = this.bootAddress.path;
    this.pendingDeepLink = normalizePath(deepLink) === '' ? null : deepLink;
    this.location.subscribe(() => {
      this.userNavigated = true;
    });
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
      )
      .subscribe((event) => this.landed(event.urlAfterRedirects));

    this.lastRoutes = this.registry.contentRoutes();
    this.lastOmitted = this.registry.omittedContentRoutes();
    this.applyConfig(this.lastRoutes, this.lastOmitted);
    this.router.initialNavigation();

    effect(
      () => {
        const routes = this.registry.contentRoutes();
        const omitted = this.registry.omittedContentRoutes();
        if (routes === this.lastRoutes && omitted === this.lastOmitted) {
          return;
        }
        this.lastRoutes = routes;
        this.lastOmitted = omitted;
        const wasParked = this.parkedOnPlaceholder;
        this.applyConfig(routes, omitted);

        this.reuse.pruneExcept((key) => matchRoute(routes, key) !== undefined);
        this.retryDeepLink(wasParked);
        this.retryHeld();
      },
      { injector: this.injector },
    );

    let firstAuthRun = true;
    effect(
      () => {
        this.auth.state();
        if (firstAuthRun) {
          firstAuthRun = false;
          return;
        }
        untracked(() => {
          const current = matchRoute(
            this.registry.contentRoutes(),
            this.router.url,
          );
          if (!current?.access) {
            return;
          }
          void this.router
            .navigateByUrl(this.router.url, { onSameUrlNavigation: 'reload' })
            .catch(() => undefined);
        });
      },
      { injector: this.injector },
    );
  }

  private applyConfig(
    routes: readonly RegisteredContentRoute[],
    omitted: readonly ContentRoute[],
  ): void {
    const pending = this.pendingPlaceholder(routes);
    this.parkedOnPlaceholder = pending.length > 0;
    this.reportAddressesDeclaredTwice(routes);
    this.router.resetConfig([
      { path: `${POPOUT_PREFIX}/**`, component: PopoutView },
      ...this.ownedFirst,
      ...buildContentRoutes(routes, omitted, this.retention),
      ...pending,
      ...this.ownedLast,
    ]);
  }

  private reportAddressesDeclaredTwice(
    routes: readonly RegisteredContentRoute[],
  ): void {
    if (!isDevMode()) {
      return;
    }
    for (const route of this.ownedFirst) {
      const path = normalizePath(route.path ?? '');
      const contributed = routes.some(
        (candidate) => normalizePath(candidate.path) === path,
      );
      if (!contributed || this.reportedTwice.has(path)) {
        continue;
      }
      this.reportedTwice.add(path);
      const named = path === '' ? 'The address naming no content' : `"${path}"`;
      console.warn(
        `${named} is declared by the distribution and by a plugin — ` +
          `the distribution's route is what it resolves to.`,
      );
    }
  }

  private pendingPlaceholder(
    routes: readonly RegisteredContentRoute[],
  ): Routes {
    const target = this.pendingDeepLink;
    if (target === null) {
      return [];
    }
    const path = normalizePath(target);
    const matched = matchRoute(routes, path);
    if (path === '' || segmentsOf(matched?.path ?? '').length > 0) {
      return [];
    }
    return [
      {
        path,
        component: RouteUnavailableView,
        canActivate: [keepPopout, settleWorkspace],
        data: { content: true, routePlaceholder: true },
      },
    ];
  }

  private landed(url: string): void {
    this.landings += 1;
    this.releaseHeld(url);
    this.noteUserChoice(url);
  }

  private noteUserChoice(url: string): void {
    if (this.landings <= 1 || this.pendingDeepLink === null) {
      return;
    }
    if (normalizePath(url) !== normalizePath(this.pendingDeepLink)) {
      this.userNavigated = true;
    }
  }

  private releaseHeld(landed: string): void {
    if (
      this.heldAddress !== null &&
      normalizePath(landed) !== normalizePath(this.heldAddress)
    ) {
      this.heldAddress = null;
    }
  }

  private retryHeld(): void {
    const target = this.heldAddress;
    if (!target) {
      return;
    }
    if (normalizePath(this.router.url) === normalizePath(target)) {
      this.heldAddress = null;
      return;
    }
    if (this.landings > this.heldAt) {
      this.heldAddress = null;
      return;
    }
    if (matchRoute(this.lastRoutes, target) === undefined) {
      return;
    }
    this.heldAddress = null;
    void this.router
      .navigateByUrl(target, { onSameUrlNavigation: 'reload' })
      .catch(() => undefined);
  }

  private retryDeepLink(wasParked: boolean): void {
    const target = this.pendingDeepLink;
    if (!target) {
      return;
    }
    const here = normalizePath(this.router.url);
    if ((here === normalizePath(target) && !wasParked) || this.userNavigated) {
      this.pendingDeepLink = null;
      return;
    }

    const matched = matchRoute(this.lastRoutes, target);
    if (matched === undefined || segmentsOf(matched.path).length === 0) {
      return;
    }
    void this.router
      .navigateByUrl(target, { onSameUrlNavigation: 'reload' })
      .then((ok) => {
        if (ok) {
          this.pendingDeepLink = null;
        }
      })
      .catch(() => {
        this.pendingDeepLink = null;
      });
  }
}

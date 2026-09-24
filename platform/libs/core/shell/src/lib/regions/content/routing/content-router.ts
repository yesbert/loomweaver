import { Location } from '@angular/common';
import {
  effect,
  inject,
  Injector,
  isDevMode,
  Service,
  untracked,
} from '@angular/core';
import { NavigationEnd, Router, Routes } from '@angular/router';
import { filter } from 'rxjs';
import { ContentRoute } from '@loomweaver/plugin-sdk';
import {
  ContributionRegistry,
  RegisteredContentRoute,
} from '../../../plugin/contribution-registry';
import { AuthContext } from '../../../auth/auth-context';
import { BootAddress } from './boot-address';
import { DISTRIBUTION_ROUTES, isCatchAll } from './distribution-routes';
import { buildContentRoutes, routePlaceholder } from './content-route-table';
import { matchRoute, normalizePath, segmentsOf } from '../content-path';
import { POPOUT_PREFIX } from '../../../popout/popout-path';
import { PopoutView } from '../../../popout/popout-view';

@Service()
export class ContentRouter {
  private readonly registry = inject(ContributionRegistry);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly bootAddress = inject(BootAddress);
  private readonly injector = inject(Injector);
  private readonly auth = inject(AuthContext);
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

  ownsTheOpeningAddress(): boolean {
    return this.ownedFirst.some(
      (route) => normalizePath(route.path ?? '') === '',
    );
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
    this.followNavigation();

    this.lastRoutes = this.registry.contentRoutes();
    this.lastOmitted = this.registry.omittedContentRoutes();
    this.applyConfig(this.lastRoutes, this.lastOmitted);
    this.router.initialNavigation();

    this.followRegistry();
    this.rematchOnSessionChange();
  }

  private followNavigation(): void {
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
  }

  private followRegistry(): void {
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

        this.retryDeepLink(wasParked);
        this.retryHeld();
      },
      { injector: this.injector },
    );
  }

  private rematchOnSessionChange(): void {
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
      ...buildContentRoutes(routes, omitted),
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
    return [routePlaceholder(path)];
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

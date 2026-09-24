import { inject, Service } from '@angular/core';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { AuthContext } from '../../auth/auth-context';
import { isViewPanePath } from '../pane/tree/pane-address';
import { surfaceForPanePath } from '../pane/pane-surface';
import { canHostInPane } from './pane-targets';
import { matchRoute } from './content-path';

@Service()
export class PaneAdmission {
  private readonly registry = inject(ContributionRegistry);
  private readonly auth = inject(AuthContext);

  canOfferAsPaneTarget(path: string): boolean {
    if (isViewPanePath(path)) {
      return this.viewAllowed(path);
    }
    return canHostInPane(this.registry, this.auth, path);
  }

  canDuplicate(path: string): boolean {
    if (isViewPanePath(path)) {
      return this.viewAllowed(path);
    }
    const route = matchRoute(this.registry.contentRoutes(), path);
    return route !== undefined && this.auth.meets(route.access);
  }

  routerBound(path: string): boolean {
    return !isViewPanePath(path) && !this.canOfferAsPaneTarget(path);
  }

  private viewAllowed(path: string): boolean {
    const surface = surfaceForPanePath(
      this.registry.contentRoutes(),
      this.registry.views(),
      path,
    );
    return surface !== undefined && this.auth.meets(surface.access);
  }
}

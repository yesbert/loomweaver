import { inject, Service } from '@angular/core';
import { RegisteredContentRoute } from '../../../contributions/contribution-registry';
import { RetainedViewStash } from '../../pane/retention/retained-view-stash';
import {
  LiveSurfaceRoute,
  SurfaceAddress,
  liveSurfaceRoute,
} from './live-surface-route';

interface BoundRoute {
  readonly route: RegisteredContentRoute;
  readonly live: LiveSurfaceRoute;
  paneViews: number;
}

@Service()
export class LiveSurfaceRoutes {
  private readonly stash = inject(RetainedViewStash);

  private readonly bound = new Map<string, BoundRoute>();

  bind(
    route: RegisteredContentRoute,
    key: string,
    address: SurfaceAddress,
  ): LiveSurfaceRoute {
    this.forgetUnread();
    const known = this.bound.get(key);
    if (known?.route === route) {
      known.paneViews += 1;
      return known.live;
    }
    const live = liveSurfaceRoute(route, address, key);
    this.bound.set(key, { route, live, paneViews: 1 });
    return live;
  }

  unbind(key: string, live: LiveSurfaceRoute): void {
    const known = this.bound.get(key);
    if (known?.live === live) {
      known.paneViews -= 1;
    }
    this.forgetUnread();
  }

  private forgetUnread(): void {
    for (const [key, entry] of this.bound) {
      if (entry.paneViews === 0 && !this.kept(key)) {
        this.bound.delete(key);
      }
    }
  }

  private kept(key: string): boolean {
    return this.stash.keyedInstances().some((entry) => entry.key === key);
  }
}

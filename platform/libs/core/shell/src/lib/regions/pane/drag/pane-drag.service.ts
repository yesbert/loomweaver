import { computed, inject, Service, signal, Signal } from '@angular/core';
import { VIEW_PANE_PREFIX } from '../tree/pane-address';
import { surfaceForPanePath } from '../pane-surface';
import { offRouterMountable } from '../../content/pane-targets';
import { matchRoute } from '../../content/content-path';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { AuthContext } from '../../../auth/auth-context';

export interface TabDragSource {
  readonly dock: string;
  readonly paneId: string;
}

@Service()
export class PaneDragService {
  private readonly registry = inject(ContributionRegistry);
  private readonly auth = inject(AuthContext);

  private readonly draggedPath = signal<string | null>(null);
  private readonly zones = signal<readonly string[]>([]);
  private readonly strips = signal<readonly string[]>([]);

  readonly dragging: Signal<string | null> = this.draggedPath.asReadonly();

  readonly dropTargetIds = computed<readonly string[]>(() => [
    ...this.zones(),
    ...this.strips(),
  ]);

  start(path: string): void {
    this.draggedPath.set(path);
  }

  stop(): void {
    this.draggedPath.set(null);
  }

  registerZone(id: string): () => void {
    this.zones.update((ids) => [...ids, id]);
    return () =>
      this.zones.update((ids) => ids.filter((existing) => existing !== id));
  }

  registerStrip(id: string): () => void {
    this.strips.update((ids) => [...ids, id]);
    return () =>
      this.strips.update((ids) => ids.filter((existing) => existing !== id));
  }

  /**
   * Whether `path` may be OFFERED as a target for a pane that shows nothing yet. Nothing is on
   * screen, so an address standing for one particular thing cannot be offered: a picker entry has no
   * identifier to put in it. Use {@link canDuplicate} for an item already on screen, where it does.
   */
  canHost(path: string): boolean {
    if (path.startsWith(VIEW_PANE_PREFIX)) {
      return this.viewAllowed(path);
    }
    return offRouterMountable(this.registry, this.auth, path);
  }

  /**
   * Whether the item at `path` can be shown in a second pane beside the one already showing it.
   * A split duplicates what is on screen, so the shape of the address decides nothing here: the
   * identifier in it is known. What cannot be duplicated is what the workbench could not show at
   * all, meaning content the signed-in user may not see.
   */
  canDuplicate(path: string): boolean {
    if (path.startsWith(VIEW_PANE_PREFIX)) {
      return this.viewAllowed(path);
    }
    const route = matchRoute(this.registry.contentRoutes(), path);
    return route !== undefined && this.auth.meets(route.access);
  }

  routerBound(path: string): boolean {
    return !path.startsWith(VIEW_PANE_PREFIX) && !this.canHost(path);
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

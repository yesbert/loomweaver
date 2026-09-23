import { inject, isDevMode, Service, signal, untracked } from '@angular/core';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { CONTAINER_CHILD_REGION } from '../../../plugin/surface-normalize';
import { surfaceForPanePath } from '../pane-surface';
import { PaneNode } from '../tree/pane-node';

@Service()
export class LeftOutChildren {
  private readonly registry = inject(ContributionRegistry);

  private readonly ids = signal<ReadonlySet<string>>(new Set());

  setShown(surfaceId: string, shown: boolean): void {
    this.ids.update((ids) => {
      if (ids.has(surfaceId) !== shown) {
        return ids;
      }
      const next = new Set(ids);
      if (shown) {
        next.delete(surfaceId);
      } else {
        next.add(surfaceId);
      }
      return next;
    });
  }

  setShownBy(pluginId: string, surfaceId: string, shown: boolean): void {
    const child = untracked(() =>
      this.registry.views().find((view) => view.id === surfaceId),
    );
    if (
      child?.region !== CONTAINER_CHILD_REGION ||
      child.pluginId !== pluginId
    ) {
      if (isDevMode()) {
        console.warn(
          `Plugin "${pluginId}": setChildShown("${surfaceId}") changed nothing, because it is not a container child this plugin registered.`,
        );
      }
      return;
    }
    this.setShown(surfaceId, shown);
  }

  isLeftOut(surfaceId: string): boolean {
    return this.ids().has(surfaceId);
  }

  hides(path: string): boolean {
    const ids = this.ids();
    if (ids.size === 0) {
      return false;
    }
    const surface = surfaceForPanePath(
      this.registry.contentRoutes(),
      this.registry.views(),
      path,
    );
    return surface?.id !== undefined && ids.has(surface.id);
  }
}

export function shownTree(
  node: PaneNode,
  hides: (path: string) => boolean,
): PaneNode | null {
  if (node.kind === 'leaf') {
    const tabs = node.tabs.filter((tab) => !hides(tab.path));
    if (tabs.length === node.tabs.length) {
      return node;
    }
    if (tabs.length === 0 && node.declared !== true) {
      return null;
    }
    const active = tabs.some((tab) => tab.path === node.active)
      ? node.active
      : tabs[0]?.path;
    return { ...node, tabs, active };
  }
  const first = shownTree(node.first, hides);
  const second = shownTree(node.second, hides);
  if (first === null || second === null) {
    return first ?? second;
  }
  return first === node.first && second === node.second
    ? node
    : { ...node, first, second };
}

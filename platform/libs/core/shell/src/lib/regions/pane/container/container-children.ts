import { ContainerChild, ContainerSpec } from '@loomweaver/plugin-sdk';
import { View } from '../../../layout/view';
import { matchRoute, segmentsOf } from '../../content/content-path';

export interface ContainerChildDeclaration {
  readonly surface: string;
  readonly segment?: string;
}

export function containerChildren(
  spec: ContainerSpec | undefined,
): readonly ContainerChildDeclaration[] {
  return (spec?.children ?? []).map((child: ContainerChild) =>
    typeof child === 'string' ? { surface: child } : child,
  );
}

export function containerChildIds(
  spec: ContainerSpec | undefined,
): readonly string[] {
  return containerChildren(spec).map((child) => child.surface);
}

export function containerChildOf(
  spec: ContainerSpec | undefined,
  surfaceId: string,
): ContainerChildDeclaration | undefined {
  return containerChildren(spec).find((child) => child.surface === surfaceId);
}

export function isAddressable(segment: string | undefined): boolean {
  return segment !== undefined && !segment.includes(':');
}

export function childForSegmentPath<V extends View>(
  spec: ContainerSpec | undefined,
  views: readonly V[],
  rest: string,
): { child: V; declaration: ContainerChildDeclaration } | undefined {
  const candidates = containerChildren(spec)
    .filter((child) => child.segment !== undefined)
    .map((child) => ({
      child,
      view: views.find((view) => view.id === child.surface),
    }))
    .filter(
      (entry): entry is { child: ContainerChildDeclaration; view: V } =>
        entry.view !== undefined,
    );
  const matched = matchRoute(
    candidates.map((entry) => ({ ...entry, path: entry.child.segment ?? '' })),
    rest,
  );
  return matched
    ? { child: matched.view, declaration: matched.child }
    : undefined;
}

export const CONTAINER_DOCK_PREFIX = 'container@';

export function containerDockFor(path: string): string {
  return CONTAINER_DOCK_PREFIX + path;
}

export function isContainerDock(dock: string): boolean {
  return dock.startsWith(CONTAINER_DOCK_PREFIX);
}

export function containerPathOfDock(dock: string): string {
  return dock.slice(CONTAINER_DOCK_PREFIX.length);
}

export function containerChildPath(
  containerPath: string,
  segmentPath: string,
): string {
  return segmentsOf(`${containerPath}/${segmentPath}`).join('/');
}

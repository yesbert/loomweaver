import { viewIdOfPanePath } from '../tree/pane-address';
import { PaneTab } from '../tree/pane-node';
import { surfaceForPanePath } from '../pane-surface';
import type { StripTab } from '../chrome/strip-tab';
import { isHomePath } from '../../content/content-path';
import { ContributionRegistry } from '../../../plugin/contribution-registry';

export interface PaneLabel {
  readonly title: string;
  readonly literalTitle: boolean;
  readonly icon?: string;
}

export function resolveTitle(
  label: Pick<PaneLabel, 'title' | 'literalTitle'>,
  translate: (key: string) => string,
): string {
  return label.literalTitle ? label.title : translate(label.title);
}

export function overlayTabTitle(tab: PaneTab, fallback: PaneLabel): PaneLabel {
  return {
    title: tab.title ?? fallback.title,
    literalTitle:
      tab.title === undefined
        ? fallback.literalTitle
        : (tab.literalTitle ?? false),
    icon: tab.icon ?? fallback.icon,
  };
}

export function paneLabelOf(
  registry: ContributionRegistry,
  path: string,
): PaneLabel {
  if (isHomePath(path)) {
    return { title: 'content.split.home', literalTitle: false };
  }
  const surface = surfaceForPanePath(
    registry.contentRoutes(),
    registry.views(),
    path,
  );
  if (surface === undefined) {
    return viewIdOfPanePath(path) === null
      ? { title: path, literalTitle: true }
      : { title: 'content.split.pick', literalTitle: false };
  }
  if (!('path' in surface)) {
    return { title: surface.title, literalTitle: false, icon: surface.icon };
  }
  return surface.title
    ? {
        title: surface.title,
        literalTitle: surface.titleIsLiteral ?? false,
        icon: surface.icon,
      }
    : { title: path, literalTitle: true, icon: surface.icon };
}

export function surfaceClosable(
  registry: ContributionRegistry,
  path: string,
): boolean {
  return (
    surfaceForPanePath(registry.contentRoutes(), registry.views(), path)
      ?.closable !== false
  );
}

export function toStripTab(
  registry: ContributionRegistry,
  tab: PaneTab,
): StripTab {
  const effective = overlayTabTitle(tab, paneLabelOf(registry, tab.path));
  return {
    path: tab.path,
    title: effective.title,
    literalTitle: effective.literalTitle,
    icon: effective.icon,
    closable: tab.closable !== false && surfaceClosable(registry, tab.path),
    preview: tab.preview ?? false,
    pinned: tab.pinned ?? false,
    instance: tab.instance,
  };
}

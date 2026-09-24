import {
  DockPosition,
  LayoutRegion,
  PanelRegion,
  RegionType,
  ShellLayout,
} from './layout';

export function regionsOfType(
  layout: ShellLayout,
  type: RegionType,
): LayoutRegion[] {
  return layout.regions.filter((region) => region.type === type);
}

export function panelRegions(layout: ShellLayout): PanelRegion[] {
  return layout.regions.filter(
    (region): region is PanelRegion => region.type === 'panel',
  );
}

export function regionIdsOfType(
  layout: ShellLayout,
  type: RegionType,
): string[] {
  return regionsOfType(layout, type).map((region) => region.id);
}

export function hasRegionOfType(
  layout: ShellLayout,
  type: RegionType,
): boolean {
  return layout.regions.some((region) => region.type === type);
}

export function hasContentRegion(layout: ShellLayout): boolean {
  return hasRegionOfType(layout, 'content');
}

export function sideCount(layout: ShellLayout, type: RegionType): number {
  return new Set(regionsOfType(layout, type).map((region) => region.dock)).size;
}

export function regionsAt(
  layout: ShellLayout,
  dock: DockPosition,
  type: RegionType,
): LayoutRegion[] {
  return layout.regions.filter(
    (region) => region.dock === dock && region.type === type,
  );
}

export function regionById(
  layout: ShellLayout,
  id: string,
): LayoutRegion | undefined {
  return layout.regions.find((region) => region.id === id);
}

export function regionOnSide(
  layout: ShellLayout,
  type: RegionType,
  dock: DockPosition,
  exceptId: string,
): LayoutRegion | undefined {
  return layout.regions.find(
    (region) =>
      region.type === type && region.dock === dock && region.id !== exceptId,
  );
}

export function regionOnOtherSide(
  layout: ShellLayout,
  type: RegionType,
  fromId: string,
): LayoutRegion | undefined {
  const from = regionById(layout, fromId);
  if (!from) {
    return undefined;
  }
  return layout.regions.find(
    (region) =>
      region.type === type && region.id !== fromId && region.dock !== from.dock,
  );
}

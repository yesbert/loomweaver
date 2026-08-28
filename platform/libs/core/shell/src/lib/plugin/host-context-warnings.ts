import { isDevMode } from '@angular/core';
import { Command, Surface } from '@loomweaver/plugin-sdk';
import { LayoutRegion, RegionType } from '../layout/layout';
import { View } from '../layout/view';
import { containerLayout } from '../regions/pane/container/container-layout';
import { CONTAINER_CHILD_REGION } from './surface-normalize';

export function warnUndescribedCallable(pluginId: string, command: Command): void {
  if (!isDevMode() || command.callable !== true) {
    return;
  }
  if (command.description === undefined) {
    console.warn(
      `Plugin "${pluginId}" opened command "${command.id}" to other callers but gave it no ` +
        `description — the caller it opened itself to has nothing to go on but an id, since the ` +
        `title labels a control rather than explaining the action.`,
    );
  }
  for (const argument of command.arguments ?? []) {
    if (argument.description === '') {
      console.warn(
        `Plugin "${pluginId}": command "${command.id}" declares the argument ` +
          `"${argument.name}" with an empty description, which tells a caller nothing about what ` +
          `to put there.`,
      );
    }
  }
}

export function warnUnsupportedRetain(pluginId: string, surface: Surface): void {
  if (!isDevMode()) {
    return;
  }
  if (surface.retain !== undefined && surface.container !== undefined) {
    console.warn(
      `Plugin "${pluginId}" declares retain: '${surface.retain}' on surface "${surface.id}" — ` +
        `a container surface is not retainable and is always rebuilt when hidden. ` +
        `The declaration is ignored.`,
    );
  }
  if (surface.saveOn !== undefined && surface.iframe !== undefined) {
    console.warn(
      `Plugin "${pluginId}" declares saveOn: '${surface.saveOn}' on surface "${surface.id}" — ` +
        `a sandboxed surface has no save channel across the RPC boundary, so the host cannot save it ` +
        `for you. Save from inside the surface and push setDirty(false). The declaration is ignored.`,
    );
  }
  if (
    surface.retain === 'always' &&
    (surface.routable?.subRoutes?.length ?? 0) > 0
  ) {
    console.warn(
      `Plugin "${pluginId}" declares retain: 'always' on surface "${surface.id}", which also ` +
        `declares subRoutes. A retained surface mounts outside the router — its route activates only ` +
        `a stub — so a <router-outlet> inside it stays inert and sub-routes will not render there. ` +
        `Read the sub-segment from the address instead, or drop one of the two declarations.`,
    );
  }
}

export function warnUnusableContainerLayout(
  pluginId: string,
  surface: Surface,
): void {
  if (!isDevMode() || surface.container === undefined) {
    return;
  }
  const problems: string[] = [];
  const { node } = containerLayout(
    '',
    surface.container,
    problems,
    `Plugin "${pluginId}": surface "${surface.id}"`,
  );
  for (const problem of problems) {
    console.warn(problem);
  }
  if (node === null && surface.container.initial !== undefined) {
    console.warn(
      `Plugin "${pluginId}": surface "${surface.id}" declares an initial arrangement that ` +
        `holds nothing usable — the container opens empty and the user picks its children.`,
    );
  }
}

export function warnUnlessPanelRegion(
  pluginId: string,
  regions: readonly LayoutRegion[],
  view: View,
): void {
  if (!isDevMode()) {
    return;
  }
  if (view.region === CONTAINER_CHILD_REGION) {
    return;
  }
  const region = regions.find((r) => r.id === view.region);
  if (region?.type !== 'panel') {
    const detail = region ? `a '${region.type}' region` : 'an unknown region';
    console.warn(
      `Plugin "${pluginId}" registered surface "${view.id}" with home dock "${view.region}" — ` +
        `${detail}. A non-routable surface renders only in 'panel' regions; for the content area ` +
        `add routable: { path }. This surface will not appear.`,
    );
  }
}

export function warnUnlessRegionType(
  pluginId: string,
  regions: readonly LayoutRegion[],
  itemId: string,
  regionId: string,
  expected: RegionType,
): void {
  if (!isDevMode()) {
    return;
  }
  const region = regions.find((r) => r.id === regionId);
  if (region?.type === expected) {
    return;
  }
  const detail = region
    ? `a '${region.type}' region`
    : 'a region this distribution does not declare';
  console.warn(
    `Plugin "${pluginId}" registered "${itemId}" into '${regionId}' — ${detail}. ` +
      `A '${expected}' item renders only in a '${expected}' region, so this will not appear. ` +
      `Check the region ids in the distribution's provideLayout().`,
  );
}

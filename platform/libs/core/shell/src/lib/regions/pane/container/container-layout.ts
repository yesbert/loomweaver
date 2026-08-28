import { ContainerSpec, ContainerTabEntry } from '@loomweaver/plugin-sdk';
import {
  containerChildOf,
  containerChildPath,
  containerPathOfDock,
  isAddressable,
} from './container-children';
import { BakedTab, PaneAreaTree, paneAreaTree } from '../tree/pane-area-tree';
import { VIEW_PANE_PREFIX } from '../tree/pane-address';
import { PaneTab } from '../tree/pane-node';

export function containerLayout(
  dock: string,
  spec: ContainerSpec | undefined,
  problems: string[],
  context: string,
): PaneAreaTree {
  const initial = spec?.initial;
  if (initial === undefined) {
    return { node: null, tabs: [] };
  }
  const area = Array.isArray(initial)
    ? { tabs: initial as readonly ContainerTabEntry[] }
    : (initial as Exclude<
        ContainerSpec['initial'],
        readonly string[] | undefined
      >);
  return paneAreaTree(
    area,
    {
      context,
      idPrefix: 'container',
      allowEmpty: true,
      bake: (entry, found) => bakeChild(dock, spec, entry, found, context),
    },
    problems,
  );
}

export function containerChildTab(
  dock: string,
  spec: ContainerSpec | undefined,
  childId: string,
  segmentPath?: string,
): PaneTab {
  const declared = containerChildOf(spec, childId);
  const address =
    segmentPath ??
    (isAddressable(declared?.segment) ? declared?.segment : undefined);
  if (address === undefined) {
    return {
      path: VIEW_PANE_PREFIX + childId,
      instance: `${dock}::${childId}`,
    };
  }
  const path = containerChildPath(containerPathOfDock(dock), address);
  return { path, instance: `${dock}::${path}` };
}

function bakeChild(
  dock: string,
  spec: ContainerSpec | undefined,
  entry: ContainerTabEntry,
  problems: string[],
  context: string,
): BakedTab | null {
  const declared = typeof entry === 'string' ? { surface: entry } : entry;
  if (typeof declared?.surface !== 'string' || declared.surface.length === 0) {
    problems.push(
      `${context}: an initial entry must be a child surface id or { surface } — the entry is dropped.`,
    );
    return null;
  }
  const child = containerChildOf(spec, declared.surface);
  if (child === undefined) {
    problems.push(
      `${context}: initial names "${declared.surface}", which is not listed in children — ` +
        `the tab is dropped. A container mounts only what it offers.`,
    );
    return null;
  }
  if (child.segment !== undefined && !isAddressable(child.segment)) {
    problems.push(
      `${context}: initial names "${declared.surface}", whose segment "${child.segment}" carries a ` +
        `value — the tab is dropped, because nothing here knows which one. A sibling opens it; ` +
        `declare tabs: [] for the pane it should land in.`,
    );
    return null;
  }
  return {
    tab: {
      ...containerChildTab(dock, spec, declared.surface),
      ...(declared.closable === false ? { closable: false } : {}),
    },
    active: declared.active === true,
  };
}

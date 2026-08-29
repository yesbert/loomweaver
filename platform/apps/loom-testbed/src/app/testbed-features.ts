import { ShellFeaturesInput } from '@loomweaver/shell';

export const TESTBED_FEATURES_KEY = 'lw.testbed.features';

const FLAGS: Readonly<Record<string, ShellFeaturesInput>> = {
  split: { content: { splitRight: false, splitDown: false } },
  close: { content: { close: false } },
  move: { content: { moveTabs: false } },
  escalate: { content: { escalate: false } },
  pin: { content: { pin: false } },
  reorder: { content: { reorderTabs: false } },
  preview: { content: { preview: false } },
  'new-tab': { content: { newTab: false } },
  maximize: { content: { maximize: false } },
  minimize: { content: { minimize: false } },
  'sidebar-collapse': { sidebar: { collapse: false } },
  'sidebar-resize': { sidebar: { resize: false } },
  'sidebar-reorder': { sidebar: { reorderViews: false } },
  'sidebar-move': { sidebar: { moveViews: false } },
  'sidebar-hide': { sidebar: { hideViews: false } },
  'sidebar-curate': { sidebar: { curate: false } },
  'sidebar-stack': { sidebar: { stackViews: false } },
  'sidebar-accept': { sidebar: { acceptTabs: false } },
  'sidebar-content': { sidebar: { openViewInContent: false } },
  'sidebar-reset': { sidebar: { resetViewState: false } },
  'sidebar-instances': { sidebar: { instances: false } },
  'rail-reorder': { rail: { reorder: false } },
  'rail-move': { rail: { moveItems: false } },
  'rail-hide': { rail: { hideItems: false } },
  'rail-curate': { rail: { curate: false } },
  workspaces: { workspaces: { enabled: false } },
  popout: { windows: { popout: false } },
  shortcuts: { commands: { shortcuts: false } },
  recent: { commands: { recentlyUsed: false } },
};

export function testbedFeatures(raw: string | null): ShellFeaturesInput {
  let merged: ShellFeaturesInput = {};
  for (const flag of (raw ?? '').split(',')) {
    const patch = FLAGS[flag.trim()];
    if (!patch) {
      continue;
    }
    merged = {
      content: { ...merged.content, ...patch.content },
      sidebar: { ...merged.sidebar, ...patch.sidebar },
      rail: { ...merged.rail, ...patch.rail },
      workspaces: { ...merged.workspaces, ...patch.workspaces },
      windows: { ...merged.windows, ...patch.windows },
      commands: { ...merged.commands, ...patch.commands },
    };
  }
  return merged;
}

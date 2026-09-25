import { ShellFeaturesInput } from '@loomweaver/shell';

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
    if (patch) {
      merged = mergeFeatures(merged, patch);
    }
  }
  return merged;
}

function mergeFeatures(
  into: ShellFeaturesInput,
  patch: ShellFeaturesInput,
): ShellFeaturesInput {
  const merged: Record<string, object | undefined> = { ...into };
  for (const [group, values] of Object.entries(patch)) {
    merged[group] = { ...merged[group], ...values };
  }
  return merged as ShellFeaturesInput;
}

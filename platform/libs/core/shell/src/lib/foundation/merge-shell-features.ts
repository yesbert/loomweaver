import type { ShellFeatures, ShellFeaturesInput } from './shell-features';

export function mergeShellFeatures(
  base: ShellFeatures,
  input: ShellFeaturesInput,
): ShellFeatures {
  return {
    content: { ...base.content, ...input.content },
    sidebar: { ...base.sidebar, ...input.sidebar },
    rail: { ...base.rail, ...input.rail },
    workspaces: { ...base.workspaces, ...input.workspaces },
    windows: { ...base.windows, ...input.windows },
    commands: { ...base.commands, ...input.commands },
  };
}

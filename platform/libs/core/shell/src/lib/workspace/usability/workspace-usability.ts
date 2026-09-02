import { CONTENT_DOCK } from '../../regions/pane/tree/pane-address';
import { parseDocks } from '../../regions/pane/tree/pane-tree-storage';
import { collectTabs } from '../../regions/pane/tree/pane-queries';
import { WorkspaceDefinition, declaredTabPaths } from '../workspace-definition';

export interface WorkspaceOrigin {
  readonly id: string;
  readonly origin: string | null;
}

export function everyWorkspaceOrigin(
  definitions: readonly WorkspaceDefinition[],
  saved: readonly { id: string }[],
  originOf: (id: string) => string | null,
): readonly WorkspaceOrigin[] {
  return [
    ...definitions.map((definition) => ({
      id: definition.id,
      origin: definition.id,
    })),
    ...saved.map((workspace) => ({
      id: workspace.id,
      origin: originOf(workspace.id),
    })),
  ];
}

export interface UsabilityReading {
  readonly workspaces: readonly WorkspaceOrigin[];
  readonly activeId: string;
  readonly activeHasContent: boolean;
  readonly definitionOf: (id: string) => WorkspaceDefinition | undefined;
  readonly storedTrees: (id: string) => string | undefined;
}

export function unusableWorkspaceIds(
  reading: UsabilityReading,
): ReadonlySet<string> {
  const ids = new Set<string>();
  for (const { id, origin } of reading.workspaces) {
    if (!declaresContent(reading, origin)) {
      continue;
    }
    if (!hasContent(reading, id)) {
      ids.add(id);
    }
  }
  return ids;
}

function declaresContent(
  reading: UsabilityReading,
  origin: string | null,
): boolean {
  if (origin === null) {
    return false;
  }
  const definition = reading.definitionOf(origin);
  return definition !== undefined && declaredTabPaths(definition).length > 0;
}

function hasContent(reading: UsabilityReading, id: string): boolean {
  if (id === reading.activeId) {
    return reading.activeHasContent;
  }
  const raw = reading.storedTrees(id);
  if (raw === undefined) {
    return true;
  }
  const entry = parseDocks(raw)[CONTENT_DOCK];
  return entry !== undefined && collectTabs(entry.node).length > 0;
}

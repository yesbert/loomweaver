import { type WorkspaceClaim } from '../workspace-claims';
import { WorkspaceDefinition } from './workspace-definition';

export const BUILT_IN_WORKSPACE_ID = 'default';

export function startingWorkspaceId(
  definitions: readonly WorkspaceDefinition[],
): string {
  return (
    dedupedDefinitions(definitions).find((definition) => definition.initial)
      ?.id ?? BUILT_IN_WORKSPACE_ID
  );
}

export function offersBuiltInWorkspace(
  definitions: readonly WorkspaceDefinition[],
): boolean {
  return startingWorkspaceId(definitions) === BUILT_IN_WORKSPACE_ID;
}

export function dedupedDefinitions(
  definitions: readonly WorkspaceDefinition[],
): WorkspaceDefinition[] {
  const seen = new Set<string>([BUILT_IN_WORKSPACE_ID]);
  return definitions.filter((definition) => {
    if (seen.has(definition.id)) {
      return false;
    }
    seen.add(definition.id);
    return true;
  });
}

export function claimsOf(
  definitions: readonly WorkspaceDefinition[],
): readonly WorkspaceClaim[] {
  return dedupedDefinitions(definitions).flatMap((definition) =>
    (definition.claims ?? []).map((pattern) => ({
      workspaceId: definition.id,
      pattern,
    })),
  );
}

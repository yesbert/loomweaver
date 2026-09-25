import { BUILT_IN_WORKSPACE_ID, claimsOf, offersBuiltInWorkspace, startingWorkspaceId } from '../declaration/composed-definitions';
import { PanelDeclarations } from '../declaration/definition-baseline';
import { WorkspaceDefinition } from '../declaration/workspace-definition';
import {
  settlementFor,
  withoutConflicts,
  type WorkspaceClaim,
} from '../workspace-claims';
import { type Workspace } from './workspace-state';
import { definitionBaseline } from '../declaration/definition-baseline';

export function definitionOf(
  definitions: readonly WorkspaceDefinition[],
  id: string,
): WorkspaceDefinition | undefined {
  return definitions.find((definition) => definition.id === id);
}

export function workspaceExists(
  id: string,
  definitions: readonly WorkspaceDefinition[],
  saved: readonly Workspace[],
): boolean {
  return (
    id === startingWorkspaceId(definitions) ||
    definitionOf(definitions, id) !== undefined ||
    saved.some((workspace) => workspace.id === id)
  );
}

export function baselineOf(
  id: string,
  definitions: readonly WorkspaceDefinition[],
  saved: readonly Workspace[],
  panels: PanelDeclarations,
): Readonly<Record<string, string>> {
  const stored = saved.find((workspace) => workspace.id === id)?.baseline;
  if (stored) {
    return stored;
  }
  const definition = definitionOf(definitions, id);
  return definition ? definitionBaseline(definition, panels) : {};
}

export function activeClaims(
  definitions: readonly WorkspaceDefinition[],
): readonly WorkspaceClaim[] {
  return withoutConflicts(claimsOf(definitions));
}

export function originOf(
  id: string,
  definitions: readonly WorkspaceDefinition[],
  saved: readonly Workspace[],
): string | null {
  if (definitionOf(definitions, id) !== undefined) {
    return id;
  }
  const origin = saved.find((workspace) => workspace.id === id)?.origin;
  return origin !== undefined && definitionOf(definitions, origin) !== undefined
    ? origin
    : null;
}

export function claimsOfWorkspace(
  id: string,
  definitions: readonly WorkspaceDefinition[],
  saved: readonly Workspace[],
): readonly WorkspaceClaim[] {
  const origin = originOf(id, definitions, saved);
  return origin === null
    ? []
    : activeClaims(definitions).filter((claim) => claim.workspaceId === origin);
}

export function settlementDestination(
  path: string,
  here: string,
  definitions: readonly WorkspaceDefinition[],
  saved: readonly Workspace[],
): string | null {
  return settlementFor(
    activeClaims(definitions),
    claimsOfWorkspace(here, definitions, saved),
    here,
    path,
  );
}

export function changeCandidates(
  definitions: readonly WorkspaceDefinition[],
  saved: readonly Workspace[],
  panels: PanelDeclarations,
): readonly { id: string; baseline: Readonly<Record<string, string>> }[] {
  const builtIn = offersBuiltInWorkspace(definitions)
    ? [{ id: BUILT_IN_WORKSPACE_ID, baseline: {} }]
    : [];
  return [
    ...builtIn,
    ...definitions.map((definition) => ({
      id: definition.id,
      baseline: definitionBaseline(definition, panels),
    })),
    ...saved,
  ];
}

import { DEFAULT_WORKSPACE_ID } from '../active-workspace.service';
import { WorkspaceDefinition, claimsOf } from '../workspace-definition';
import {
  settlementFor,
  withoutConflicts,
  type WorkspaceClaim,
} from '../workspace-claims';
import {
  definitionBaseline,
  HIDDEN_VIEWS_KEY,
  PANE_TREES_KEY,
  type Workspace,
} from './workspace-state';

export interface BaselineContext {
  readonly panelRegions: readonly string[];
  readonly declaredPaths: (region: string) => string[];
}

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
    id === DEFAULT_WORKSPACE_ID ||
    definitionOf(definitions, id) !== undefined ||
    saved.some((workspace) => workspace.id === id)
  );
}

export function definitionBaselineOf(
  definition: WorkspaceDefinition,
  context: BaselineContext,
): Record<string, string> {
  return definitionBaseline(definition, {
    panelRegions: context.panelRegions,
    declaredPaths: context.declaredPaths,
    hiddenViewsKey: HIDDEN_VIEWS_KEY,
    paneTreesKey: PANE_TREES_KEY,
  });
}

export function baselineOf(
  id: string,
  definitions: readonly WorkspaceDefinition[],
  saved: readonly Workspace[],
  context: BaselineContext,
): Readonly<Record<string, string>> {
  const stored = saved.find((workspace) => workspace.id === id)?.baseline;
  if (stored) {
    return stored;
  }
  const definition = definitionOf(definitions, id);
  return definition ? definitionBaselineOf(definition, context) : {};
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
  context: BaselineContext,
): readonly { id: string; baseline: Readonly<Record<string, string>> }[] {
  return [
    { id: DEFAULT_WORKSPACE_ID, baseline: {} },
    ...definitions.map((definition) => ({
      id: definition.id,
      baseline: definitionBaselineOf(definition, context),
    })),
    ...saved,
  ];
}

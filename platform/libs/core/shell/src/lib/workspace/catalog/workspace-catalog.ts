import { inject, isDevMode, Service } from '@angular/core';
import { SHELL_LAYOUT } from '../../layout/layout';
import { regionIdsOfType } from '../../layout/layout-queries';
import { persistedSetting } from '../../persistence/stored-values/persisted-setting';
import {
  activeClaims,
  claimsOfWorkspace,
  definitionOf,
  originOf,
  workspaceExists,
} from './workspace-lookup';
import {
  WORKSPACES_KEY,
  parseWorkspaces,
  type Workspace,
} from './saved-workspaces';
import {
  BUILT_IN_WORKSPACE_ID,
  dedupedDefinitions,
  offersBuiltInWorkspace,
  startingWorkspaceId,
} from '../declaration/composed-definitions';
import { auditWorkspaceDefinitions } from '../declaration/definition-audit';
import { WORKSPACE_DEFINITIONS } from '../declaration/provide-workspaces';
import { WorkspaceDefinition } from '../declaration/workspace-definition';
import { type WorkspaceClaim } from '../workspace-claims';

export interface WorkspaceOrigin {
  readonly id: string;
  readonly origin: string | null;
}

@Service()
export class WorkspaceCatalog {
  private readonly declared = (
    inject(WORKSPACE_DEFINITIONS, { optional: true }) ?? []
  ).flat();

  private readonly stored = persistedSetting<Workspace[]>(WORKSPACES_KEY, {
    parse: parseWorkspaces,
    serialize: (list) => JSON.stringify(list),
  });

  readonly definitions: readonly WorkspaceDefinition[] = dedupedDefinitions(
    this.declared,
  );

  readonly saved = this.stored.value;

  readonly startingId = startingWorkspaceId(this.definitions);

  readonly offersBuiltIn = offersBuiltInWorkspace(this.definitions);

  constructor() {
    if (!isDevMode()) {
      return;
    }
    const panelRegions = regionIdsOfType(inject(SHELL_LAYOUT), 'panel');
    for (const problem of auditWorkspaceDefinitions(
      this.declared,
      panelRegions,
    )) {
      console.warn(problem);
    }
  }

  commit(next: Workspace[]): void {
    this.stored.set(next);
  }

  definitionOf(id: string): WorkspaceDefinition | undefined {
    return definitionOf(this.definitions, id);
  }

  isBuiltInOrDeclared(id: string): boolean {
    return id === BUILT_IN_WORKSPACE_ID || this.definitionOf(id) !== undefined;
  }

  exists(id: string): boolean {
    return workspaceExists(id, this.definitions, this.saved());
  }

  originOf(id: string): string | null {
    return originOf(id, this.definitions, this.saved());
  }

  claimsOfWorkspace(id: string): readonly WorkspaceClaim[] {
    return claimsOfWorkspace(id, this.definitions, this.saved());
  }

  activeClaims(): readonly WorkspaceClaim[] {
    return activeClaims(this.definitions);
  }

  everyOrigin(): readonly WorkspaceOrigin[] {
    return [
      ...this.definitions.map((definition) => ({
        id: definition.id,
        origin: definition.id,
      })),
      ...this.saved().map((workspace) => ({
        id: workspace.id,
        origin: this.originOf(workspace.id),
      })),
    ];
  }
}

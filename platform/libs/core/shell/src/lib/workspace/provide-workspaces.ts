import {
  EnvironmentProviders,
  InjectionToken,
  makeEnvironmentProviders,
} from '@angular/core';
import { WorkspaceDefinition } from './workspace-definition';

/**
 * The developer-defined workspaces of the composition — each {@link provideWorkspaces} call
 * contributes one batch. Read by the workspace service; a distribution never injects this itself.
 */
export const WORKSPACE_DEFINITIONS = new InjectionToken<
  readonly (readonly WorkspaceDefinition[])[]
>('lw.workspaceDefinitions');

/**
 * Ships developer-defined workspaces with the distribution (composition root). They are switchable,
 * self-remembering (each keeps its live working state per workspace) and resettable to the
 * declaration — but their baseline lives in code, so the user cannot overwrite, rename or delete
 * them. The workspace dialog therefore lists them separately from the user's own, opening on
 * whichever list holds the active workspace. Invalid declarations are reported to
 * the console in dev mode, naming what is ignored; nothing fails silently at runtime.
 */
export function provideWorkspaces(
  ...definitions: WorkspaceDefinition[]
): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: WORKSPACE_DEFINITIONS, useValue: definitions, multi: true },
  ]);
}

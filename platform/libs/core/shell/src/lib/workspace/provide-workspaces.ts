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
 * Whether the workbench tells the user, in the workspace itself, that a workspace cannot work as its
 * declaration describes, and offers the reset that repairs it. On unless the composition passes
 * {@link withoutUnusableWorkspaceNotice}. Read by the workbench; a distribution never injects it.
 */
export const ANNOUNCE_UNUSABLE_WORKSPACES = new InjectionToken<boolean>(
  'lw.announceUnusableWorkspaces',
  { providedIn: 'root', factory: () => true },
);

/**
 * One optional setting for the workspaces of a composition, passed alongside the declarations to
 * {@link provideWorkspaces}. Produced by a `without…` function; a distribution never writes one.
 */
export interface WorkspacesFeature {
  readonly kind: 'workspaces-feature';
  readonly announcesUnusable: boolean;
}

/**
 * Silences the workbench where a workspace cannot work as its declaration describes, for the whole
 * composition. Nothing else changes: the stored arrangement is still restored untouched, the
 * workspace is still entered rather than exchanged for another, and which workspaces are affected
 * stays readable — so a product that takes this turns the answer over to itself rather than away.
 */
export function withoutUnusableWorkspaceNotice(): WorkspacesFeature {
  return { kind: 'workspaces-feature', announcesUnusable: false };
}

function isFeature(
  declaration: WorkspaceDefinition | WorkspacesFeature,
): declaration is WorkspacesFeature {
  return (declaration as WorkspacesFeature).kind === 'workspaces-feature';
}

/**
 * Ships developer-defined workspaces with the distribution (composition root). They are switchable,
 * self-remembering (each keeps its live working state per workspace) and resettable to the
 * declaration — but their baseline lives in code, so the user cannot overwrite, rename or delete
 * them. The workspace dialog therefore lists them separately from the user's own, opening on
 * whichever list holds the active workspace. Invalid declarations are reported to
 * the console in dev mode, naming what is ignored; nothing fails silently at runtime.
 *
 * A {@link WorkspacesFeature} such as {@link withoutUnusableWorkspaceNotice} may be passed among the
 * declarations; it settles that one question for the whole composition rather than per workspace.
 */
export function provideWorkspaces(
  ...declarations: (WorkspaceDefinition | WorkspacesFeature)[]
): EnvironmentProviders {
  const features = declarations.filter(isFeature);
  const definitions = declarations.filter(
    (declaration): declaration is WorkspaceDefinition => !isFeature(declaration),
  );
  return makeEnvironmentProviders([
    { provide: WORKSPACE_DEFINITIONS, useValue: definitions, multi: true },
    ...(features.length === 0
      ? []
      : [
          {
            provide: ANNOUNCE_UNUSABLE_WORKSPACES,
            useValue: features.every((feature) => feature.announcesUnusable),
          },
        ]),
  ]);
}

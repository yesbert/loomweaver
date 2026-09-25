import { ContentRoute } from '@loomweaver/plugin-sdk';
import { matchRoute, normalizePath } from '../../regions/content/content-path';
import { VIEW_PANE_PREFIX } from '../../regions/pane/tree/pane-address';
import { conflictingClaims } from '../workspace-claims';
import { BUILT_IN_WORKSPACE_ID, claimsOf } from './composed-definitions';
import { contentTree, declaredTabPaths } from './declared-content';
import { WorkspaceDefinition } from './workspace-definition';

export function auditWorkspaceDefinitions(
  definitions: readonly WorkspaceDefinition[],
  panelRegions: readonly string[],
): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  let initial: string | null = null;
  for (const definition of definitions) {
    if (definition.id === BUILT_IN_WORKSPACE_ID) {
      problems.push(
        `Workspace definition id "default" collides with the built-in default workspace — the definition is ignored.`,
      );
      continue;
    }
    if (seen.has(definition.id)) {
      problems.push(
        `Workspace "${definition.id}" is declared twice — the later declaration is ignored.`,
      );
      continue;
    }
    seen.add(definition.id);
    if (definition.initial) {
      if (initial === null) {
        initial = definition.id;
      } else {
        problems.push(
          `Workspace "${definition.id}" also declares initial: true — "${initial}" already does, so this one is ignored.`,
        );
      }
    }
    auditDefinition(definition, panelRegions, problems);
  }
  problems.push(...conflictingClaims(claimsOf(definitions)));
  return problems;
}

function auditDefinition(
  definition: WorkspaceDefinition,
  panelRegions: readonly string[],
  problems: string[],
): void {
  if (definition.content !== undefined) {
    const { node } = contentTree(definition, problems);
    if (node === null) {
      problems.push(
        `Workspace "${definition.id}": the content declaration is invalid — it is ignored and the workspace starts on the empty layout.`,
      );
    }
  }
  for (const region of Object.keys(definition.sidebars ?? {})) {
    if (!panelRegions.includes(region)) {
      problems.push(
        `Workspace "${definition.id}": sidebars names "${region}", which is no panel region of this layout — the entry is ignored.`,
      );
    }
  }
}

export interface DeclarationSurroundings {
  readonly routes: readonly ContentRoute[];
  readonly declaredPaths: (regionId: string) => readonly string[];
}

export function declarationGaps(
  definition: WorkspaceDefinition,
  around: DeclarationSurroundings,
): readonly string[] {
  const id = definition.id;
  return [
    ...claimGaps(definition, around.routes, id),
    ...tabGaps(definition, around.routes, id),
    ...sidebarGaps(definition, around.declaredPaths, id),
  ];
}

function claimGaps(
  definition: WorkspaceDefinition,
  routes: readonly ContentRoute[],
  id: string,
): readonly string[] {
  return (definition.claims ?? [])
    .filter((pattern) => matchRoute(routes, pattern) === undefined)
    .map(
      (pattern) =>
        `Workspace "${id}": the claim "${pattern}" matches no registered surface route — no address will ever lead here through it.`,
    );
}

function tabGaps(
  definition: WorkspaceDefinition,
  routes: readonly ContentRoute[],
  id: string,
): readonly string[] {
  return declaredTabPaths(definition).flatMap((path) => {
    const route = matchRoute(routes, path);
    if (
      !route ||
      (normalizePath(route.path) === '' && normalizePath(path) !== '')
    ) {
      return [
        `Workspace "${id}": tab path "${path}" matches no registered surface route — the tab renders a placeholder.`,
      ];
    }
    return route.chromeless === true
      ? [
          `Workspace "${id}": tab path "${path}" points to a chromeless surface — it never renders as a tab.`,
        ]
      : [];
  });
}

function sidebarGaps(
  definition: WorkspaceDefinition,
  declaredPaths: (regionId: string) => readonly string[],
  id: string,
): readonly string[] {
  return Object.entries(definition.sidebars ?? {}).flatMap(
    ([region, visible]) => {
      const declared = new Set(
        declaredPaths(region).map((path) =>
          path.slice(VIEW_PANE_PREFIX.length),
        ),
      );
      return visible
        .filter((viewId) => !declared.has(viewId))
        .map(
          (viewId) =>
            `Workspace "${id}": sidebar view "${viewId}" is not declared for region "${region}" — the entry has no effect.`,
        );
    },
  );
}

export function warnDeclarationGaps(
  definition: WorkspaceDefinition,
  around: DeclarationSurroundings,
): void {
  for (const gap of declarationGaps(definition, around)) {
    console.warn(gap);
  }
}

import { ContentRoute } from '@loomweaver/plugin-sdk';
import { matchRoute, normalizePath } from '../regions/content/content-path';
import { VIEW_PANE_PREFIX } from '../regions/pane/tree/pane-address';
import { declaredTabPaths, WorkspaceDefinition } from './workspace-definition';

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
        declaredPaths(region).map((path) => path.slice(VIEW_PANE_PREFIX.length)),
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

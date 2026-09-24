import {
  AccessRequirement,
  ContentRoute,
  Surface,
  SurfacePresentation,
  SurfaceRoutable,
  View,
  ViewAction,
} from '@loomweaver/plugin-sdk';

export const CONTAINER_CHILD_REGION = '__container-child';

/**
 * A {@link ContentRoute} as the registry holds it: the plugin's own declaration plus the **host-stamped**
 * id of the plugin that registered it. The id is not part of the authoring contract — a plugin must not be
 * able to claim someone else's identity — so it lives here rather than in `@loomweaver/plugin-sdk`.
 */
export type RegisteredContentRoute = ContentRoute & {
  readonly pluginId?: string;
};

/**
 * A {@link View} as the registry holds it: the plugin's own declaration plus the **host-stamped** id
 * of the plugin that registered it, mirroring {@link RegisteredContentRoute}. The stamp is what lets
 * the retention guards find a plugin's dirty instances before the plugin is disabled or uninstalled.
 */
export type RegisteredView = View & {
  readonly pluginId?: string;
};

export type RegisteredSurface = SurfacePresentation & {
  readonly id?: string;
  readonly title?: string;
  readonly icon?: string;
  readonly order?: number;
  readonly actions?: readonly ViewAction[];
  readonly access?: AccessRequirement;
  readonly instanceable?: boolean;
  readonly retain?: 'always' | 'never';
  readonly saveOn?: 'hide';
  readonly closable?: boolean;
  readonly padded?: boolean;
  readonly routable?: SurfaceRoutable;
  readonly docks?: readonly string[];
  readonly pluginId?: string;
};

type CommonSurfaceFields = Pick<
  RegisteredSurface,
  'access' | 'retain' | 'saveOn' | 'closable' | 'padded' | 'order'
>;

type DockedSurfaceFields = Pick<
  RegisteredSurface,
  'id' | 'title' | 'icon' | 'actions' | 'instanceable'
>;

function commonSurfaceFields(source: CommonSurfaceFields): CommonSurfaceFields {
  return {
    access: source.access,
    retain: source.retain,
    saveOn: source.saveOn,
    closable: source.closable,
    padded: source.padded,
    order: source.order,
  };
}

function dockedSurfaceFields(source: DockedSurfaceFields): DockedSurfaceFields {
  return {
    id: source.id,
    title: source.title,
    icon: source.icon,
    actions: source.actions,
    instanceable: source.instanceable,
  };
}

export function isRoutableSurface(surface: Surface): boolean {
  return surface.routable !== undefined;
}

export function surfaceToEntry(
  surface: Surface,
  pluginId?: string,
): RegisteredSurface {
  if (!surface.routable) {
    assertDockable(surface);
  }
  return {
    ...dockedSurfaceFields(surface),
    ...commonSurfaceFields(surface),
    routable: surface.routable,
    docks: surface.docks,
    pluginId,
    ...presentationOf(surface),
  } as RegisteredSurface;
}

export function viewToEntry(view: View, pluginId?: string): RegisteredSurface {
  return {
    ...dockedSurfaceFields(view),
    ...commonSurfaceFields(view),
    docks: [view.region],
    pluginId,
    ...presentationOf(view),
  } as RegisteredSurface;
}

export function contentRouteToEntry(
  route: ContentRoute,
  pluginId?: string,
): RegisteredSurface {
  return {
    id: route.id,
    ...commonSurfaceFields(route),
    routable: {
      path: route.path,
      chromeless: route.chromeless,
      title: route.title,
      icon: route.icon,
      titleIsLiteral: route.titleIsLiteral,
      subRoutes: route.subRoutes,
      rest: route.rest,
      follows: route.follows,
    },
    pluginId,
    ...presentationOf(route),
  } as RegisteredSurface;
}

export function entryToContentRoute(
  entry: RegisteredSurface,
): RegisteredContentRoute {
  return cached(routeCache, entry, () => {
    const routable = entry.routable;
    if (!routable) {
      throw new Error(
        `Surface "${entry.id}" is not routable; it has no content route.`,
      );
    }
    return {
      id: entry.id,
      path: routable.path,
      chromeless: routable.chromeless,
      title: routable.title ?? entry.title,
      icon: routable.icon ?? entry.icon,
      titleIsLiteral: routable.titleIsLiteral,
      subRoutes: routable.subRoutes,
      rest: routable.rest,
      follows: routable.follows,
      ...commonSurfaceFields(entry),
      pluginId: entry.pluginId,
      ...presentationOf(entry),
    } as RegisteredContentRoute;
  });
}

export function entryToView(entry: RegisteredSurface): RegisteredView {
  return cached(viewCache, entry, () => ({
    ...dockedSurfaceFields(entry),
    ...commonSurfaceFields(entry),
    id: entry.id ?? '',
    region: entry.docks?.[0] ?? CONTAINER_CHILD_REGION,
    title: entry.title ?? '',
    pluginId: entry.pluginId,
    component: entry.component,
    loadComponent: entry.loadComponent,
    iframe: entry.iframe,
  }));
}

const routeCache = new WeakMap<RegisteredSurface, RegisteredContentRoute>();
const viewCache = new WeakMap<RegisteredSurface, RegisteredView>();

function cached<T extends object>(
  cache: WeakMap<RegisteredSurface, T>,
  entry: RegisteredSurface,
  build: () => T,
): T {
  const hit = cache.get(entry);
  if (hit) {
    return hit;
  }
  const built = build();
  cache.set(entry, built);
  return built;
}

function assertDockable(surface: Surface): void {
  if (surface.container !== undefined) {
    throw new Error(
      `Surface "${surface.id}" is a container but not routable — a container tab holds its own ':id' ` +
        `. Add a routable: { path } declaration.`,
    );
  }
  if (surface.docks === undefined) {
    throw new Error(
      `Surface "${surface.id}" is non-routable but declares no docks — it has no home region to dock into. ` +
        `Add docks: ['<regionId>'] (e.g. a panel region), or docks: [] for a container-only child, or make it routable.`,
    );
  }
}

function presentationOf(source: {
  readonly component?: unknown;
  readonly loadComponent?: unknown;
  readonly iframe?: unknown;
  readonly container?: unknown;
}) {
  if (source.container !== undefined) {
    return { container: source.container };
  }
  if (source.iframe !== undefined) {
    return { iframe: source.iframe };
  }
  return source.loadComponent
    ? { loadComponent: source.loadComponent }
    : { component: source.component };
}

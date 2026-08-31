import {
  ContainerArea,
  ContainerSpec,
  ContainerTabEntry,
  MenuContext,
  MenuItem,
  NotificationInput,
  NotificationKind,
  OpenTabInput,
  Surface,
  SurfacePresentation,
} from '@loomweaver/plugin-sdk';

const MAX_RPC_AREA_DEPTH = 8;

export function sanitizeRpcSurface(
  pluginId: string,
  surface: Surface,
  permitted?: readonly string[],
): Surface {
  const raw = (surface ?? {}) as unknown as Record<string, unknown>;
  const { id, title } = rpcSurfaceIdentity(pluginId, raw);
  const container = sanitizeRpcContainer(raw['container']);
  const iframe =
    container === undefined
      ? rpcIframeUrl(pluginId, raw['iframe'], permitted)
      : undefined;
  const routable = sanitizeRpcRoutable(raw['routable']);
  const docks = sanitizeRpcDocks(raw['docks']);
  assertRpcSurfaceAddress(pluginId, container, routable, docks);

  const shared: Omit<Surface, keyof SurfacePresentation> = {
    id,
    title,
    icon: typeof raw['icon'] === 'string' ? raw['icon'] : undefined,
    order: typeof raw['order'] === 'number' ? raw['order'] : undefined,
    instanceable: raw['instanceable'] === true ? true : undefined,
    retain:
      raw['retain'] === 'always' || raw['retain'] === 'never'
        ? raw['retain']
        : undefined,
    saveOn: raw['saveOn'] === 'hide' ? 'hide' : undefined,
    closable: raw['closable'] === false ? false : undefined,
    padded: typeof raw['padded'] === 'boolean' ? raw['padded'] : undefined,
    routable,
    docks,
  };
  return container === undefined
    ? { ...shared, iframe: iframe as string }
    : { ...shared, container };
}

function rpcSurfaceIdentity(
  pluginId: string,
  raw: Record<string, unknown>,
): { id: string; title: string } {
  if (typeof raw['id'] !== 'string' || raw['id'].length === 0) {
    throw new Error(
      `Sandbox plugin "${pluginId}": registerSurface requires a non-empty 'id'.`,
    );
  }
  if (typeof raw['title'] !== 'string' || raw['title'].length === 0) {
    throw new Error(
      `Sandbox plugin "${pluginId}": registerSurface requires a non-empty 'title'.`,
    );
  }
  if ('component' in raw || 'loadComponent' in raw) {
    throw new Error(
      `Sandbox plugin "${pluginId}": a component surface cannot cross the RPC boundary — ` +
        `use the { iframe } or { container } form.`,
    );
  }
  if ('access' in raw) {
    throw new Error(
      `Sandbox plugin "${pluginId}": 'access' does not cross the RPC boundary — ` +
        `a sandboxed surface gates itself from the pushed session state.`,
    );
  }
  return { id: raw['id'], title: raw['title'] };
}

function rpcIframeUrl(
  pluginId: string,
  value: unknown,
  permitted: readonly string[] | undefined,
): string {
  if (typeof value !== 'string') {
    throw new TypeError(
      `Sandbox plugin "${pluginId}": registerSurface needs an { iframe } URL or a { container } spec.`,
    );
  }
  const origin = surfaceOrigin(value);
  if (origin === null || !permittedOrigins(permitted).has(origin)) {
    throw new Error(
      `Sandbox plugin "${pluginId}": the iframe surface must be served from an origin this ` +
        `distribution permitted for it, got "${value}".`,
    );
  }
  return value;
}

function assertRpcSurfaceAddress(
  pluginId: string,
  container: ContainerSpec | undefined,
  routable: Surface['routable'] | undefined,
  docks: readonly string[] | undefined,
): void {
  if (routable === undefined && docks === undefined) {
    throw new Error(
      `Sandbox plugin "${pluginId}": registerSurface needs 'routable.path' (a URL-addressed surface) ` +
        `or 'docks' (a surface hosted at a dock).`,
    );
  }
  if (container !== undefined && routable === undefined) {
    throw new Error(
      `Sandbox plugin "${pluginId}": a container surface must be routable — a container tab holds ` +
        `its own ':id'.`,
    );
  }
}

function sanitizeRpcRoutable(value: unknown): Surface['routable'] | undefined {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }
  const routable = value as Record<string, unknown>;
  if (typeof routable['path'] !== 'string' || routable['path'].length === 0) {
    return undefined;
  }
  return {
    path: routable['path'],
    chromeless: routable['chromeless'] === true ? true : undefined,
    title:
      typeof routable['title'] === 'string' ? routable['title'] : undefined,
    titleIsLiteral: routable['titleIsLiteral'] === true ? true : undefined,
    icon: typeof routable['icon'] === 'string' ? routable['icon'] : undefined,
    subRoutes: Array.isArray(routable['subRoutes'])
      ? routable['subRoutes'].filter(
          (sub): sub is string => typeof sub === 'string',
        )
      : undefined,
    rest: routable['rest'] === true ? true : undefined,
    follows: routable['follows'] === true ? true : undefined,
  };
}

function sanitizeRpcDocks(value: unknown): readonly string[] | undefined {
  return Array.isArray(value)
    ? value.filter((dock): dock is string => typeof dock === 'string')
    : undefined;
}

function sanitizeRpcContainer(value: unknown): ContainerSpec | undefined {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }
  const raw = value as Record<string, unknown>;
  const children = Array.isArray(raw['children'])
    ? raw['children'].filter((id): id is string => typeof id === 'string')
    : [];
  return { children, initial: sanitizeRpcInitial(raw['initial']) };
}

function sanitizeRpcInitial(value: unknown): ContainerSpec['initial'] {
  if (Array.isArray(value)) {
    return value.filter((id): id is string => typeof id === 'string');
  }
  return sanitizeRpcArea(value, 1);
}

function sanitizeRpcArea(
  value: unknown,
  depth: number,
): ContainerArea | undefined {
  if (
    depth > MAX_RPC_AREA_DEPTH ||
    typeof value !== 'object' ||
    value === null
  ) {
    return undefined;
  }
  const raw = value as Record<string, unknown>;
  const size = typeof raw['size'] === 'number' ? { size: raw['size'] } : {};
  if (Array.isArray(raw['tabs'])) {
    return { ...size, tabs: raw['tabs'].flatMap((value) => sanitizeRpcContainerTab(value)) };
  }
  for (const kind of ['rows', 'columns'] as const) {
    const declared = raw[kind];
    if (Array.isArray(declared)) {
      const children = declared
        .map((child) => sanitizeRpcArea(child, depth + 1))
        .filter((child): child is ContainerArea => child !== undefined);
      return { ...size, [kind]: children } as ContainerArea;
    }
  }
  return undefined;
}

function sanitizeRpcContainerTab(value: unknown): ContainerTabEntry[] {
  if (typeof value === 'string') {
    return [value];
  }
  if (typeof value !== 'object' || value === null) {
    return [];
  }
  const raw = value as Record<string, unknown>;
  if (typeof raw['surface'] !== 'string') {
    return [];
  }
  return [
    {
      surface: raw['surface'],
      ...(raw['closable'] === false && { closable: false }),
      ...(raw['active'] === true && { active: true }),
    },
  ];
}

function surfaceOrigin(iframe: string): string | null {
  try {
    const origin = new URL(iframe, document.baseURI).origin;
    return origin === 'null' ? null : origin;
  } catch {
    return null;
  }
}

function permittedOrigins(extra: readonly string[] | undefined): Set<string> {
  const permitted = new Set([location.origin]);
  for (const candidate of extra ?? []) {
    try {
      const url = new URL(candidate);
      if (url.protocol === 'https:' || url.protocol === 'http:') {
        permitted.add(url.origin);
      }
    } catch {
      continue;
    }
  }
  return permitted;
}

export function sanitizeRpcTabInput(input: OpenTabInput): OpenTabInput {
  const raw = (input ?? {}) as unknown as Record<string, unknown>;
  if (typeof raw['path'] !== 'string' || raw['path'].length === 0) {
    throw new Error(
      'Sandbox plugin: openContentTab requires a non-empty string path.',
    );
  }
  return {
    path: raw['path'],
    title: typeof raw['title'] === 'string' ? raw['title'] : raw['path'],
    titleIsLiteral: raw['titleIsLiteral'] === true ? true : undefined,
    icon: typeof raw['icon'] === 'string' ? raw['icon'] : undefined,
    preview: raw['preview'] === true ? true : undefined,
  };
}

export function sanitizeRpcToastInput(
  input: NotificationInput,
): NotificationInput {
  const raw = (input ?? {}) as unknown as Record<string, unknown>;
  if (typeof raw['message'] !== 'string' || raw['message'].length === 0) {
    throw new Error(
      'Sandbox plugin: toast requires a non-empty string message.',
    );
  }
  const kind = raw['kind'];
  const timeoutMs = raw['timeoutMs'];
  return {
    message: raw['message'],
    kind: isNotificationKind(kind) ? kind : undefined,
    timeoutMs:
      typeof timeoutMs === 'number' && Number.isFinite(timeoutMs)
        ? timeoutMs
        : undefined,
    id: typeof raw['id'] === 'string' ? raw['id'] : undefined,
  };
}

const NOTIFICATION_KINDS = new Set<NotificationKind>([
  'info',
  'success',
  'warning',
  'error',
]);

function isNotificationKind(value: unknown): value is NotificationKind {
  return NOTIFICATION_KINDS.has(value as NotificationKind);
}

export function sanitizeRpcMenuItem(item: MenuItem): MenuItem {
  const raw = (item ?? {}) as unknown as Record<string, unknown>;
  if (typeof raw['menu'] !== 'string' || raw['menu'].length === 0) {
    throw new Error(
      'Sandbox plugin: registerMenuItem requires a non-empty string menu slot.',
    );
  }
  return {
    id: typeof raw['id'] === 'string' ? raw['id'] : undefined,
    menu: raw['menu'],
    command: typeof raw['command'] === 'string' ? raw['command'] : undefined,
    title: typeof raw['title'] === 'string' ? raw['title'] : undefined,
    group: typeof raw['group'] === 'string' ? raw['group'] : undefined,
    order: typeof raw['order'] === 'number' ? raw['order'] : undefined,
    when: sanitizeMenuContext(raw['when']),
    checkedWhen: sanitizeMenuContext(raw['checkedWhen']),
  };
}

function sanitizeMenuContext(value: unknown): MenuContext | undefined {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }
  const clean: Record<string, string | number | boolean> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (
      typeof raw === 'string' ||
      typeof raw === 'number' ||
      typeof raw === 'boolean'
    ) {
      clean[key] = raw;
    }
  }
  return clean;
}

import {
  ContainerArea,
  ContainerSpec,
  ContainerTabEntry,
  Surface,
  SurfacePresentation,
} from '@loomweaver/plugin-sdk';
import { tabBadgeOf } from '../../../contributions/tab-badge';
import {
  WireRecord,
  isWireObject,
  onlyTrue,
  optionalNumber,
  optionalText,
  requiredText,
  textList,
  wireRecord,
} from './wire-fields';

const MAX_RPC_AREA_DEPTH = 8;

export function sanitizeRpcSurface(
  pluginId: string,
  surface: Surface,
  permitted?: readonly string[],
): Surface {
  const raw = wireRecord(surface);
  const { id, title } = surfaceIdentity(pluginId, raw);
  assertCarriableSurface(pluginId, raw);
  const container = sanitizeRpcContainer(raw['container']);
  const iframe =
    container === undefined
      ? rpcIframeUrl(pluginId, raw['iframe'], permitted)
      : undefined;
  const routable = sanitizeRpcRoutable(raw['routable']);
  const docks = textList(raw['docks']);
  assertRpcSurfaceAddress(pluginId, container, routable, docks);

  const shared: Omit<Surface, keyof SurfacePresentation> = {
    id,
    title,
    icon: optionalText(raw['icon']),
    badge: tabBadgeOf(raw['badge']),
    order: optionalNumber(raw['order']),
    instanceable: onlyTrue(raw['instanceable']),
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

function surfaceIdentity(
  pluginId: string,
  raw: WireRecord,
): { id: string; title: string } {
  return {
    id: requiredText(
      raw['id'],
      `Sandbox plugin "${pluginId}": registerSurface requires a non-empty 'id'.`,
    ),
    title: requiredText(
      raw['title'],
      `Sandbox plugin "${pluginId}": registerSurface requires a non-empty 'title'.`,
    ),
  };
}

function assertCarriableSurface(pluginId: string, raw: WireRecord): void {
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
  if (!isWireObject(value)) {
    return undefined;
  }
  const path = value['path'];
  if (typeof path !== 'string' || path.length === 0) {
    return undefined;
  }
  return {
    path,
    chromeless: onlyTrue(value['chromeless']),
    title: optionalText(value['title']),
    titleIsLiteral: onlyTrue(value['titleIsLiteral']),
    icon: optionalText(value['icon']),
    subRoutes: textList(value['subRoutes']),
    rest: onlyTrue(value['rest']),
    follows: onlyTrue(value['follows']),
  };
}

function sanitizeRpcContainer(value: unknown): ContainerSpec | undefined {
  if (!isWireObject(value)) {
    return undefined;
  }
  return {
    children: textList(value['children']) ?? [],
    initial: sanitizeRpcInitial(value['initial']),
  };
}

function sanitizeRpcInitial(value: unknown): ContainerSpec['initial'] {
  return textList(value) ?? sanitizeRpcArea(value, 1);
}

function sanitizeRpcArea(
  value: unknown,
  depth: number,
): ContainerArea | undefined {
  if (depth > MAX_RPC_AREA_DEPTH || !isWireObject(value)) {
    return undefined;
  }
  const size = typeof value['size'] === 'number' ? { size: value['size'] } : {};
  if (Array.isArray(value['tabs'])) {
    return {
      ...size,
      tabs: value['tabs'].flatMap((tab) => sanitizeRpcContainerTab(tab)),
    };
  }
  for (const kind of ['rows', 'columns'] as const) {
    const declared = value[kind];
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
  if (!isWireObject(value) || typeof value['surface'] !== 'string') {
    return [];
  }
  return [
    {
      surface: value['surface'],
      ...(value['closable'] === false && { closable: false }),
      ...(value['active'] === true && { active: true }),
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

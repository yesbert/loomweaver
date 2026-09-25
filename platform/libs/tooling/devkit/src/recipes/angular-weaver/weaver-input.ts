import {
  isKebabId,
  toCamelCase,
  toPascalCase,
  toTitleCase,
} from '../../lib/generate/casing';
import { NEUTRAL_PREFIX } from '../../lib/scaffolds/scaffold-values';
import { KNOWN_CAPABILITIES } from '../../lib/validate/manifest';

export interface WeaverFeatures {
  readonly command?: boolean;
  readonly menu?: string | boolean;
  readonly settings?: boolean;
  readonly access?: string;
  readonly shortcut?: string;
  readonly barItem?: boolean;
  readonly about?: boolean;
  readonly instanceable?: boolean;
  readonly container?: boolean;
  readonly agent?: boolean;
  readonly spec?: boolean;
}

export interface WeaverInput {
  readonly id: string;
  readonly name?: string;
  readonly capabilities?: readonly string[];
  readonly features?: WeaverFeatures;
  /** Selector prefix for the generated components, kebab-case. Defaults to 'app'. */
  readonly prefix?: string;
  /** The alias the consuming workspace imports the library under. Defaults to '@loomweaver/<id>-weaver'. */
  readonly importPath?: string;
}

interface ResolvedFeatures {
  readonly command: boolean;
  readonly menuSlot?: string;
  readonly settings: boolean;
  readonly access?: string;
  readonly shortcut: string;
  readonly barItem: boolean;
  readonly about: boolean;
  readonly instanceable: boolean;
  readonly container: boolean;
  readonly agent: boolean;
  readonly spec: boolean;
}

export interface ResolvedWeaver {
  readonly id: string;
  readonly name: string;
  readonly className: string;
  readonly propertyName: string;
  readonly capabilities: readonly string[];
  readonly features: ResolvedFeatures;
  readonly prefix: string;
  readonly importPath: string;
}

const DEFAULT_MENU_SLOT = 'content/tab/context';

function accessLiteral(spec: string): string {
  if (spec === 'authenticated') {
    return '{ authenticated: true }';
  }
  if (spec === 'anonymous') {
    return '{ authenticated: false }';
  }
  if (spec.startsWith('role:')) {
    const role = spec.slice('role:'.length);
    if (!role) {
      throw new Error('Access "role:" needs a role name, e.g. "role:admin".');
    }
    if (/['\\]/.test(role)) {
      throw new Error(
        `Access role "${role}" must not contain quotes or backslashes.`,
      );
    }
    return `{ anyRole: ['${role}'] }`;
  }
  throw new Error(
    `Unknown access "${spec}". Use "authenticated", "anonymous" or "role:<name>".`,
  );
}

function resolveMenuSlot(menu: WeaverFeatures['menu']): string | undefined {
  if (menu === true) {
    return DEFAULT_MENU_SLOT;
  }
  return typeof menu === 'string' && menu.length ? menu : undefined;
}

const PLATFORM_BOUND_CHORD_TOKENS = new Set([
  'cmd',
  'command',
  'ctrl',
  'control',
  'meta',
]);

function assertPlatformNeutralChord(shortcut: string): void {
  const tokens = shortcut
    .toLowerCase()
    .split('+')
    .map((token) => token.trim());
  const bound = tokens.find((token) => PLATFORM_BOUND_CHORD_TOKENS.has(token));
  if (bound) {
    throw new Error(
      `Shortcut "${shortcut}" binds the platform-specific "${bound}" key. Use the neutral 'mod' token (e.g. 'mod+shift+k') — the host renders it as ⌘ on macOS and Ctrl elsewhere.`,
    );
  }
}

function resolveFeatures(
  id: string,
  input: WeaverFeatures | undefined,
): ResolvedFeatures {
  const menuSlot = resolveMenuSlot(input?.menu);
  const barItem = Boolean(input?.barItem);
  const hasShortcut = Boolean(input?.shortcut?.trim());
  if (hasShortcut) {
    assertPlatformNeutralChord(input?.shortcut?.trim() ?? '');
  }
  const instanceable = Boolean(input?.instanceable);
  const container = Boolean(input?.container);
  if (instanceable && container) {
    throw new Error(
      'A surface cannot be both a container and instanceable: a container tab holds its own ":id" and is therefore routable, while named instances exist only for a docked, non-routable surface. Pick one.',
    );
  }
  const agent = Boolean(input?.agent);
  return {
    command:
      Boolean(input?.command) ||
      menuSlot !== undefined ||
      barItem ||
      hasShortcut ||
      agent,
    menuSlot,
    settings: Boolean(input?.settings),
    access: input?.access ? accessLiteral(input.access) : undefined,
    shortcut: input?.shortcut?.trim() || `mod+shift+${id.charAt(0)}`,
    barItem,
    about: Boolean(input?.about),
    instanceable,
    container,
    agent,
    spec: input?.spec !== false,
  };
}

function deriveCapabilities(features: ResolvedFeatures): string[] {
  const set = new Set(['contributions', 'navigation']);
  if (features.command) set.add('ui');
  if (features.about) {
    set.add('ui');
    set.add('host');
  }
  if (features.agent) {
    set.add('ui');
    set.add('automation');
  }
  return KNOWN_CAPABILITIES.filter((capability) => set.has(capability));
}

function resolvePrefix(prefix: string | undefined): string {
  const trimmed = prefix?.trim();
  if (!trimmed) {
    return NEUTRAL_PREFIX;
  }
  if (!isKebabId(trimmed)) {
    throw new Error(
      `Selector prefix must be kebab-case (e.g. "acme"); got "${trimmed}".`,
    );
  }
  return trimmed;
}

export function resolveWeaverInput(input: WeaverInput): ResolvedWeaver {
  if (!isKebabId(input.id)) {
    throw new Error(
      `Weaver id must be kebab-case (e.g. "notes"); got "${input.id}".`,
    );
  }
  const features = resolveFeatures(input.id, input.features);
  const capabilities = input.capabilities?.length
    ? [...input.capabilities]
    : deriveCapabilities(features);
  return {
    id: input.id,
    name: input.name?.trim() || toTitleCase(input.id),
    className: toPascalCase(input.id),
    propertyName: toCamelCase(input.id),
    capabilities,
    features,
    prefix: resolvePrefix(input.prefix),
    importPath: input.importPath?.trim() || `@loomweaver/${input.id}-weaver`,
  };
}

import { angularDistribution } from '../../recipes/angular-distribution/recipe';
import { weaverAmendments } from '../../recipes/angular-weaver/amendments';
import { angularWeaver } from '../../recipes/angular-weaver/recipe';
import { authSource } from '../../recipes/auth-source/recipe';
import { layout } from '../../recipes/layout/recipe';
import { framePlugin } from '../../recipes/frame-plugin/recipe';
import { settingsStore } from '../../recipes/settings-store/recipe';
import { theme, type ThemePreset } from '../../recipes/theme/recipe';
import { Amendment } from '../amend/types';
import { amendments, generate } from '../generate/generate';
import { FileMap } from '../generate/types';
import { distributionInput, weaverInput } from './inputs';

export type ScaffoldValues = Readonly<
  Record<string, string | boolean | undefined>
>;

export interface ScaffoldOption {
  readonly name: string;
  readonly type: 'string' | 'boolean';
  readonly description: string;
  readonly required?: boolean;
  readonly default?: string | boolean;
  readonly choices?: readonly string[];
  readonly pattern?: string;
  /**
   * True for options that describe a place in an Nx workspace. An adapter that only returns or
   * writes a file map has nowhere to put them, so it leaves them out of its surface.
   */
  readonly workspaceOnly?: boolean;
}

export interface ScaffoldDescriptor {
  readonly name: string;
  readonly summary: string;
  readonly options: readonly ScaffoldOption[];
  build(values: ScaffoldValues): FileMap;
  /** What the workspace around the generated files must carry. Absent where nothing is needed. */
  amend?(values: ScaffoldValues): readonly Amendment[];
}

export function str(values: ScaffoldValues, name: string): string | undefined {
  const value = values[name];
  return typeof value === 'string' ? value : undefined;
}

export function bool(
  values: ScaffoldValues,
  name: string,
): boolean | undefined {
  const value = values[name];
  return typeof value === 'boolean' ? value : undefined;
}

/** The kebab-case spelling of a camelCase option, for command lines that prefer it. */
export function kebabCase(name: string): string {
  return name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

const ID_PATTERN = '^[a-z][a-z0-9]*(-[a-z0-9]+)*$';

const PLACEMENT_OPTIONS: readonly ScaffoldOption[] = [
  {
    name: 'directory',
    type: 'string',
    description: 'Project root, relative to the workspace root.',
    workspaceOnly: true,
  },
  {
    name: 'tags',
    type: 'string',
    description: 'Comma-separated Nx tags for the project.',
    workspaceOnly: true,
  },
  {
    name: 'prefix',
    type: 'string',
    description: 'Selector prefix for generated components and directives.',
    default: 'lw',
    pattern: ID_PATTERN,
    workspaceOnly: true,
  },
  {
    name: 'unitTestRunner',
    type: 'string',
    description:
      "Test wiring to emit. 'vitest' uses @nx/angular:unit-test; 'none' emits no test target.",
    choices: ['vitest', 'none'],
    default: 'vitest',
    workspaceOnly: true,
  },
];

const APP_OPTION: ScaffoldOption = {
  name: 'app',
  type: 'string',
  description:
    'Application to drop into. Inferred when the workspace has exactly one.',
  workspaceOnly: true,
};

export const SCAFFOLDS: readonly ScaffoldDescriptor[] = [
  {
    name: 'weaver',
    summary:
      'an Angular in-process plugin: manifest, surface, rail item, i18n, test',
    options: [
      {
        name: 'id',
        type: 'string',
        description: "Plugin id in kebab-case, e.g. 'notes'.",
        required: true,
        pattern: ID_PATTERN,
      },
      {
        name: 'name',
        type: 'string',
        description: 'Human-readable name. Defaults to a title-cased id.',
      },
      {
        name: 'command',
        type: 'boolean',
        description:
          'Also scaffold a registered command the weaver can trigger.',
        default: false,
      },
      {
        name: 'shortcut',
        type: 'string',
        description:
          "Keyboard chord for the command, e.g. 'mod+shift+k'. Implies --command.",
      },
      {
        name: 'menu',
        type: 'string',
        description:
          "Hook a menu item into a slot, e.g. 'content/tab/context'. Implies --command.",
      },
      {
        name: 'barItem',
        type: 'boolean',
        description:
          'Also add a status-bar button that triggers the command. Implies --command.',
        default: false,
      },
      {
        name: 'settings',
        type: 'boolean',
        description:
          'Also scaffold a settings section with signal-backed value owners.',
        default: false,
      },
      {
        name: 'about',
        type: 'boolean',
        description:
          'Also scaffold an About dialog that reads ctx.host, plus a bottom rail item.',
        default: false,
      },
      {
        name: 'instanceable',
        type: 'boolean',
        description:
          'Dock the surface and give it named saved instances, each with its own view state. Not combinable with --container: named instances exist only for a docked, non-routable surface.',
        default: false,
      },
      {
        name: 'container',
        type: 'boolean',
        description:
          "Make the surface a container: a routable tab at '<id>/:id' holding a nested pane tree of child surfaces, which the host draws. Not combinable with --instanceable.",
        default: false,
      },
      {
        name: 'access',
        type: 'string',
        description:
          "Auth-gate the surface and rail item: 'authenticated', 'anonymous' or 'role:<name>'.",
      },
      {
        name: 'spec',
        type: 'boolean',
        description: 'Generate a starter unit test. Use --no-spec to skip it.',
        default: true,
      },
      {
        name: 'projectName',
        type: 'string',
        description: "Nx project name. Defaults to '<id>-weaver'.",
        workspaceOnly: true,
      },
      {
        name: 'importPath',
        type: 'string',
        description:
          'Import path for the workspace alias. Defaults to the workspace scope plus the project name.',
        workspaceOnly: true,
      },
      APP_OPTION,
      ...PLACEMENT_OPTIONS,
    ],
    build: (values) => generate(angularWeaver, weaverInput(values)),
    amend: (values) => weaverAmendments(weaverInput(values), str(values, 'directory')),
  },
  {
    name: 'frame-plugin',
    summary: 'a framework-agnostic iframe plugin (Penpal + the frame UI kit)',
    options: [
      {
        name: 'id',
        type: 'string',
        description: "Plugin id in kebab-case, e.g. 'notes'.",
        required: true,
        pattern: ID_PATTERN,
      },
      {
        name: 'name',
        type: 'string',
        description: 'Human-readable name. Defaults to a title-cased id.',
      },
      APP_OPTION,
    ],
    build: (values) =>
      generate(framePlugin, {
        id: str(values, 'id') ?? '',
        name: str(values, 'name'),
      }),
  },
  {
    name: 'distribution',
    summary: 'a runnable composition root that boots the shell',
    options: [
      {
        name: 'name',
        type: 'string',
        description: "Distribution name in kebab-case, e.g. 'acme-studio'.",
        required: true,
        pattern: ID_PATTERN,
      },
      {
        name: 'title',
        type: 'string',
        description: 'Product display title. Defaults to a title-cased name.',
      },
      {
        name: 'styles',
        type: 'string',
        description:
          "Which stylesheet to emit. 'tailwind' compiles the shell's source theme and lets you write Tailwind utilities of your own; 'precompiled' imports the stylesheet we compiled, so the application needs no Tailwind and can be themed with Bootstrap or anything else.",
        choices: ['tailwind', 'precompiled'],
        default: 'tailwind',
      },
      {
        name: 'force',
        type: 'boolean',
        description:
          'Compose into the application already at that path, replacing the bootstrap files this scaffold owns and merging its build targets. Without it an existing project is an error.',
        workspaceOnly: true,
      },
      ...PLACEMENT_OPTIONS,
    ],
    build: (values) => generate(angularDistribution, distributionInput(values)),
    amend: (values) => amendments(angularDistribution, distributionInput(values)),
  },
  {
    name: 'auth-source',
    summary: 'a provider-neutral AuthSource that feeds the session',
    options: [
      {
        name: 'name',
        type: 'string',
        description: "Source name in kebab-case, e.g. 'dev'.",
        required: true,
        pattern: ID_PATTERN,
      },
      APP_OPTION,
    ],
    build: (values) =>
      generate(authSource, { name: str(values, 'name') ?? '' }),
  },
  {
    name: 'settings-store',
    summary: 'a settings-store implementation backed by your API',
    options: [
      {
        name: 'name',
        type: 'string',
        description: "Store name in kebab-case, e.g. 'backend'.",
        required: true,
        pattern: ID_PATTERN,
      },
      APP_OPTION,
    ],
    build: (values) =>
      generate(settingsStore, { name: str(values, 'name') ?? '' }),
  },
  {
    name: 'theme',
    summary: 'a token-override stylesheet in @layer lw-tenant-theme',
    options: [
      {
        name: 'name',
        type: 'string',
        description: "Theme name in kebab-case, e.g. 'midnight'.",
        required: true,
        pattern: ID_PATTERN,
      },
      {
        name: 'preset',
        type: 'string',
        description:
          "Where the token values come from. 'literal' writes editable colours; 'bootstrap' maps them onto Bootstrap 5.3's --bs-* variables, which makes the shell follow your Bootstrap theme live.",
        choices: ['literal', 'bootstrap'],
        default: 'literal',
      },
      APP_OPTION,
    ],
    build: (values) =>
      generate(theme, {
        name: str(values, 'name') ?? '',
        preset: (str(values, 'preset') as ThemePreset | undefined) ?? 'literal',
      }),
  },
  {
    name: 'layout',
    summary: 'a ShellLayout with the regions a weaver expects',
    options: [
      {
        name: 'name',
        type: 'string',
        description: 'Layout name. Defaults to a base layout.',
      },
      APP_OPTION,
    ],
    build: (values) => generate(layout, { name: str(values, 'name') }),
  },
];

export function findScaffold(name: string): ScaffoldDescriptor | undefined {
  return SCAFFOLDS.find((scaffold) => scaffold.name === name);
}

/** The option surface an adapter that only produces files can offer. */
export function portableOptions(
  scaffold: ScaffoldDescriptor,
): readonly ScaffoldOption[] {
  return scaffold.options.filter((option) => !option.workspaceOnly);
}

/**
 * The JSON Schema an Nx generator loads. Nx reads it from disk before any of our code runs, so the
 * file cannot be computed at call time — instead it is checked against this shape by a test, which
 * fails the moment the two drift apart.
 */
export function nxSchemaFor(
  scaffold: ScaffoldDescriptor,
): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  for (const option of scaffold.options) {
    properties[option.name] = {
      type: option.type,
      description: option.description,
      ...(option.pattern ? { pattern: option.pattern } : {}),
      ...(option.choices ? { enum: option.choices } : {}),
      ...(option.default === undefined ? {} : { default: option.default }),
    };
  }
  return {
    $schema: 'https://json-schema.org/schema',
    $id: `LoomWeaver${scaffold.name
      .split('-')
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join('')}`,
    title: `Scaffold ${scaffold.summary}`,
    type: 'object',
    properties,
    required: scaffold.options
      .filter((option) => option.required)
      .map((option) => option.name),
  };
}

export function usageFor(scaffold: ScaffoldDescriptor): string {
  const parts = portableOptions(scaffold).map((option) => {
    const flag = `--${kebabCase(option.name)}`;
    const body = option.type === 'boolean' ? flag : `${flag} <${option.name}>`;
    return option.required ? body : `[${body}]`;
  });
  return [scaffold.name, ...parts].join(' ');
}

import {
  angularDistribution,
  DISTRIBUTION_STYLES,
} from '../../recipes/angular-distribution/recipe';
import { weaverAmendments } from '../../recipes/angular-weaver/amendments';
import { authSourceAmendments } from '../../recipes/auth-source/amendments';
import { angularWeaver } from '../../recipes/angular-weaver/recipe';
import { authSource, type AuthSourceInput } from '../../recipes/auth-source/recipe';
import { layout } from '../../recipes/layout/recipe';
import { framePlugin } from '../../recipes/frame-plugin/recipe';
import { settingsStore } from '../../recipes/settings-store/recipe';
import {
  theme,
  THEME_PRESETS,
  type ThemePreset,
} from '../../recipes/theme/recipe';
import { KEBAB_ID_PATTERN } from '../generate/casing';
import { amendments, generate } from '../generate/generate';
import { distributionInput, weaverInput } from './inputs';
import {
  APP_OPTION,
  booleanValue,
  PLACEMENT_OPTIONS,
  ScaffoldDescriptor,
  ScaffoldValues,
  stringValue,
} from './scaffold-values';

function authSourceInput(values: ScaffoldValues): AuthSourceInput {
  return { name: stringValue(values, 'name') ?? '', bare: booleanValue(values, 'bare') };
}

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
        pattern: KEBAB_ID_PATTERN,
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
        name: 'agent',
        type: 'boolean',
        description:
          'Also scaffold the connection that lets an AG-UI agent run the commands this workbench offers: a docked panel, the seam where a call is decided before it runs, and a local stand-in that speaks the protocol so the whole path works on the first serve. Implies --command.',
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
    amend: (values) =>
      weaverAmendments(weaverInput(values), stringValue(values, 'directory')),
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
        pattern: KEBAB_ID_PATTERN,
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
        id: stringValue(values, 'id') ?? '',
        name: stringValue(values, 'name'),
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
        pattern: KEBAB_ID_PATTERN,
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
        choices: DISTRIBUTION_STYLES,
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
    amend: (values) =>
      amendments(angularDistribution, distributionInput(values)),
  },
  {
    name: 'auth-source',
    summary:
      'a stand-in session a user can operate: the AuthSource, the sign-in, switch and sign-out verbs in the rail, composed in',
    options: [
      {
        name: 'name',
        type: 'string',
        description: "Source name in kebab-case, e.g. 'dev'.",
        required: true,
        pattern: KEBAB_ID_PATTERN,
      },
      {
        name: 'bare',
        type: 'boolean',
        description:
          'Write the AuthSource alone, without the verbs, for a product that maps a session of its own onto it.',
        default: false,
      },
      APP_OPTION,
      {
        name: 'directory',
        type: 'string',
        description: 'Where the files land, relative to the workspace root.',
        workspaceOnly: true,
      },
    ],
    build: (values) => generate(authSource, authSourceInput(values)),
    amend: (values) =>
      authSourceAmendments(authSourceInput(values), stringValue(values, 'directory')),
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
        pattern: KEBAB_ID_PATTERN,
      },
      APP_OPTION,
    ],
    build: (values) =>
      generate(settingsStore, { name: stringValue(values, 'name') ?? '' }),
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
        pattern: KEBAB_ID_PATTERN,
      },
      {
        name: 'preset',
        type: 'string',
        description:
          "Where the token values come from. 'literal' writes editable colours; 'bootstrap' maps them onto Bootstrap 5.3's --bs-* variables, which makes the shell follow your Bootstrap theme live.",
        choices: THEME_PRESETS,
        default: 'literal',
      },
      APP_OPTION,
    ],
    build: (values) =>
      generate(theme, {
        name: stringValue(values, 'name') ?? '',
        preset: (stringValue(values, 'preset') as ThemePreset | undefined) ?? 'literal',
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
    build: (values) => generate(layout, { name: stringValue(values, 'name') }),
  },
];

export function findScaffold(name: string): ScaffoldDescriptor | undefined {
  return SCAFFOLDS.find((scaffold) => scaffold.name === name);
}

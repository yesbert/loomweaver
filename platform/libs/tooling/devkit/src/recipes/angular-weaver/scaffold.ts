import { KEBAB_ID_PATTERN } from '../../lib/generate/casing';
import { generate } from '../../lib/generate/generate';
import {
  APP_OPTION,
  booleanValue,
  PLACEMENT_OPTIONS,
  type ScaffoldDescriptor,
  type ScaffoldValues,
  stringValue,
} from '../../lib/scaffolds/scaffold-values';
import { weaverAmendments } from './amendments';
import { angularWeaver } from './recipe';
import type { WeaverInput } from './weaver-input';

export function weaverInput(values: ScaffoldValues): WeaverInput {
  return {
    id: stringValue(values, 'id') ?? '',
    name: stringValue(values, 'name'),
    prefix: stringValue(values, 'prefix'),
    importPath: stringValue(values, 'importPath'),
    features: {
      command: booleanValue(values, 'command'),
      shortcut: stringValue(values, 'shortcut'),
      menu: stringValue(values, 'menu'),
      barItem: booleanValue(values, 'barItem'),
      settings: booleanValue(values, 'settings'),
      about: booleanValue(values, 'about'),
      instanceable: booleanValue(values, 'instanceable'),
      container: booleanValue(values, 'container'),
      agent: booleanValue(values, 'agent'),
      access: stringValue(values, 'access'),
      spec: booleanValue(values, 'spec'),
    },
  };
}

export const weaverScaffold: ScaffoldDescriptor = {
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
    {
      name: 'prefix',
      type: 'string',
      description:
        "Selector prefix for the generated components: the one the application declares, as the prefix of its project in angular.json or project.json. Read from the workspace where it can be, else 'app'.",
      pattern: KEBAB_ID_PATTERN,
    },
    APP_OPTION,
    ...PLACEMENT_OPTIONS,
  ],
  build: (values) => generate(angularWeaver, weaverInput(values)),
  amend: (values) =>
    weaverAmendments(weaverInput(values), stringValue(values, 'directory')),
};

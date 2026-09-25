import { KEBAB_ID_PATTERN } from '../../lib/generate/casing';
import { generate } from '../../lib/generate/generate';
import {
  APP_OPTION,
  booleanValue,
  type ScaffoldDescriptor,
  type ScaffoldValues,
  stringValue,
} from '../../lib/scaffolds/scaffold-values';
import { authSourceAmendments } from './amendments';
import { authSource, type AuthSourceInput } from './recipe';

function authSourceInput(values: ScaffoldValues): AuthSourceInput {
  return { name: stringValue(values, 'name') ?? '', bare: booleanValue(values, 'bare') };
}

export const authSourceScaffold: ScaffoldDescriptor = {
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
};

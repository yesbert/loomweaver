import { KEBAB_ID_PATTERN } from '../../lib/generate/casing';
import { generate } from '../../lib/generate/generate';
import {
  APP_OPTION,
  DIRECTORY_OPTION,
  type ScaffoldDescriptor,
  stringValue,
} from '../../lib/scaffolds/scaffold-values';
import { layoutAmendments } from './amendments';
import { layout } from './recipe';

export const layoutScaffold: ScaffoldDescriptor = {
  name: 'layout',
  summary: 'a ShellLayout with the regions a weaver expects',
  options: [
    {
      name: 'name',
      type: 'string',
      description: 'Layout name, kebab-case; the file is <name>-layout.ts.',
      pattern: KEBAB_ID_PATTERN,
      default: 'base',
    },
    APP_OPTION,
    DIRECTORY_OPTION,
  ],
  build: (values) => generate(layout, { name: stringValue(values, 'name') }),
  amend: (values) =>
    layoutAmendments({ name: stringValue(values, 'name') }, stringValue(values, 'directory')),
};

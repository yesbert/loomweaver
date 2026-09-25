import { generate } from '../../lib/generate/generate';
import {
  APP_OPTION,
  type ScaffoldDescriptor,
  stringValue,
} from '../../lib/scaffolds/scaffold-values';
import { layout } from './recipe';

export const layoutScaffold: ScaffoldDescriptor = {
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
};

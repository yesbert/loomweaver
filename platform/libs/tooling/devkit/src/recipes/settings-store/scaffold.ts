import { KEBAB_ID_PATTERN } from '../../lib/generate/casing';
import { generate } from '../../lib/generate/generate';
import {
  APP_OPTION,
  type ScaffoldDescriptor,
  stringValue,
} from '../../lib/scaffolds/scaffold-values';
import { settingsStore } from './recipe';

export const settingsStoreScaffold: ScaffoldDescriptor = {
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
};

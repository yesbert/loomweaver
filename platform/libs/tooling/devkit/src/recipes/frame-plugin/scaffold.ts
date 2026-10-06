import { KEBAB_ID_PATTERN } from '../../lib/generate/casing';
import { generate } from '../../lib/generate/generate';
import {
  APP_OPTION,
  DIRECTORY_OPTION,
  type ScaffoldDescriptor,
  type ScaffoldValues,
  stringValue,
} from '../../lib/scaffolds/scaffold-values';
import { framePluginAmendments } from './amendments';
import { framePlugin, type FramePluginInput } from './recipe';

function framePluginInput(values: ScaffoldValues): FramePluginInput {
  return { id: stringValue(values, 'id') ?? '', name: stringValue(values, 'name') };
}

export const framePluginScaffold: ScaffoldDescriptor = {
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
    DIRECTORY_OPTION,
  ],
  build: (values) => generate(framePlugin, framePluginInput(values)),
  amend: (values) =>
    framePluginAmendments(framePluginInput(values), stringValue(values, 'directory')),
};

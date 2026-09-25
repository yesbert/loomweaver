import { KEBAB_ID_PATTERN } from '../../lib/generate/casing';
import { amendments, generate } from '../../lib/generate/generate';
import {
  PLACEMENT_OPTIONS,
  type ScaffoldDescriptor,
  type ScaffoldValues,
  stringValue,
} from '../../lib/scaffolds/scaffold-values';
import {
  angularDistribution,
  DISTRIBUTION_STYLES,
  type DistributionInput,
  type DistributionStyles,
} from './recipe';

export function distributionInput(values: ScaffoldValues): DistributionInput {
  return {
    name: stringValue(values, 'name') ?? '',
    title: stringValue(values, 'title'),
    directory: stringValue(values, 'directory'),
    styles:
      (stringValue(values, 'styles') as DistributionStyles | undefined) ??
      'tailwind',
  };
}

export const distributionScaffold: ScaffoldDescriptor = {
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
};

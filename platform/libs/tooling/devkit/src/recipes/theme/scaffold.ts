import { KEBAB_ID_PATTERN } from '../../lib/generate/casing';
import { generate } from '../../lib/generate/generate';
import {
  APP_OPTION,
  DIRECTORY_OPTION,
  type ScaffoldDescriptor,
  type ScaffoldValues,
  stringValue,
} from '../../lib/scaffolds/scaffold-values';
import { themeAmendments } from './amendments';
import { theme, THEME_PRESETS, type ThemeInput, type ThemePreset } from './recipe';

function themeInput(values: ScaffoldValues): ThemeInput {
  return {
    name: stringValue(values, 'name') ?? '',
    preset: (stringValue(values, 'preset') as ThemePreset | undefined) ?? 'literal',
  };
}

export const themeScaffold: ScaffoldDescriptor = {
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
    DIRECTORY_OPTION,
  ],
  build: (values) => generate(theme, themeInput(values)),
  amend: (values) => themeAmendments(themeInput(values), stringValue(values, 'directory')),
};

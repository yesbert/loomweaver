import { joinProjectPath, normalizeProjectRoot } from '../../lib/amend/merge';
import { Amendment } from '../../lib/amend/types';
import { resolveThemeInput, ThemeInput } from './recipe';

export const SHELL_STYLES = '@loomweaver/shell/styles/';

export function themeAmendments(
  input: ThemeInput,
  where: string | undefined,
): readonly Amendment[] {
  if (where === undefined || where === '') {
    return [];
  }
  const theme = resolveThemeInput(input);
  return [
    {
      kind: 'stylesheet-import',
      file: joinProjectPath(normalizeProjectRoot(where), `${theme.name}.css`),
      after: SHELL_STYLES,
      without: 'Without it the theme is never loaded and changes nothing.',
    },
  ];
}

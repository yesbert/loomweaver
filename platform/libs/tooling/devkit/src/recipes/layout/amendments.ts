import { joinProjectPath, normalizeProjectRoot } from '../../lib/amend/merge';
import { Amendment } from '../../lib/amend/types';
import { LayoutInput, resolveLayoutInput } from './recipe';

export function layoutAmendments(
  input: LayoutInput,
  where: string | undefined,
): readonly Amendment[] {
  const layout = resolveLayoutInput(input);
  if (where === undefined || where === '') {
    return [];
  }
  const symbol = `${layout.propertyName}Layout`;
  return [
    {
      kind: 'compose-provider',
      module: joinProjectPath(normalizeProjectRoot(where), `${layout.name}-layout`),
      providers: [
        {
          line: `provideLayout(${symbol}),`,
          shell: ['provideLayout'],
          own: [symbol],
          unless: 'provideLayout(',
        },
      ],
      without: 'Without it the workbench keeps the layout it has, and this one is never drawn.',
    },
  ];
}

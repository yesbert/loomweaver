import { normalizeProjectRoot } from '../../lib/amend/merge';
import { Amendment } from '../../lib/amend/types';
import { resolveWeaverInput, WeaverInput } from './recipe';

export function weaverAmendments(
  input: WeaverInput,
  where: string | undefined,
): readonly Amendment[] {
  const w = resolveWeaverInput(input);
  const directory = normalizeProjectRoot(where ?? '');
  if (!directory) {
    return [];
  }
  return [
    {
      kind: 'build-target',
      styles: [],
      assets: [
        {
          glob: '**/*.json',
          input: `${directory}/src/lib/i18n`,
          from: 'workspace',
          output: `i18n/${w.id}`,
        },
      ],
    },
    { kind: 'stylesheet-source', sourceRoot: `${directory}/src` },
    {
      kind: 'compose-plugin',
      id: w.id,
      symbol: `${w.propertyName}Plugin`,
      capabilities: w.capabilities,
      sourceRoot: `${directory}/src`,
    },
  ];
}

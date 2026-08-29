import { normalizeProjectRoot } from '../../lib/amend/merge';
import { Amendment } from '../../lib/amend/types';
import { AG_UI_ADAPTER_VERSION, AG_UI_PROTOCOL_VERSION } from './agent-files';
import { resolveWeaverInput, type WeaverInput } from './recipe';

export function weaverAmendments(
  input: WeaverInput,
  where: string | undefined,
): readonly Amendment[] {
  const w = resolveWeaverInput(input);
  const packages: readonly Amendment[] = w.features.agent
    ? [
        {
          kind: 'package',
          name: '@loomweaver/ag-ui',
          version: `^${AG_UI_ADAPTER_VERSION}`,
        },
        {
          kind: 'package',
          name: '@ag-ui/core',
          version: AG_UI_PROTOCOL_VERSION,
        },
      ]
    : [];
  const directory = normalizeProjectRoot(where ?? '');
  if (!directory) {
    return packages;
  }
  return [
    ...packages,
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

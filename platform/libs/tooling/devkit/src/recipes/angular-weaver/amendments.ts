import { joinProjectPath, normalizeProjectRoot } from '../../lib/amend/merge';
import { Amendment } from '../../lib/amend/types';
import { PLATFORM_VERSION } from '../platform-version';
import { AG_UI_PROTOCOL_VERSION } from './agent-files';
import { resolveWeaverInput, type WeaverInput } from './recipe';

export function weaverAmendments(
  input: WeaverInput,
  where: string | undefined,
): readonly Amendment[] {
  const weaver = resolveWeaverInput(input);
  const packages: readonly Amendment[] = weaver.features.agent
    ? [
        {
          kind: 'package',
          name: '@loomweaver/ag-ui',
          version: `^${PLATFORM_VERSION}`,
        },
        {
          kind: 'package',
          name: '@ag-ui/core',
          version: AG_UI_PROTOCOL_VERSION,
        },
      ]
    : [];
  if (where === undefined || where === '') {
    return packages;
  }
  const directory = normalizeProjectRoot(where);
  return [
    ...packages,
    {
      kind: 'build-target',
      styles: [],
      assets: [
        {
          glob: '**/*.json',
          input: joinProjectPath(directory, 'src/lib/i18n'),
          from: 'workspace',
          output: `i18n/${weaver.id}`,
        },
      ],
    },
    { kind: 'stylesheet-source', sourceRoot: joinProjectPath(directory, 'src') },
    {
      kind: 'compose-plugin',
      id: weaver.id,
      symbol: `${weaver.propertyName}Plugin`,
      capabilities: weaver.capabilities,
      sourceRoot: joinProjectPath(directory, 'src'),
    },
  ];
}

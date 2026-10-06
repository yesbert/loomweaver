import { grantKey, quotedList } from '../../lib/amend/compose';
import { normalizeProjectRoot } from '../../lib/amend/merge';
import { Amendment } from '../../lib/amend/types';
import { stringLiteral } from '../../lib/generate/escape';
import { PLATFORM_VERSION } from '../platform-version';
import { FramePluginInput, resolveFramePluginInput } from './recipe';

export const FRAME_PLUGIN_CAPABILITIES: readonly string[] = ['contributions', 'ui'];

export function framePluginAmendments(
  input: FramePluginInput,
  where: string | undefined,
): readonly Amendment[] {
  if (where === undefined || where === '') {
    return [];
  }
  const plugin = resolveFramePluginInput(input);
  const capabilities = quotedList(FRAME_PLUGIN_CAPABILITIES);
  const entryUrl = `/${plugin.id}/plugin.html`;
  return [
    {
      kind: 'package',
      name: '@loomweaver/frame-kit',
      version: `^${PLATFORM_VERSION}`,
    },
    {
      kind: 'build-target',
      styles: [],
      assets: [
        {
          glob: '**/*',
          input: normalizeProjectRoot(where),
          from: 'workspace',
          output: plugin.id,
          without: `without it nothing is served at /${plugin.id}/ and the plugin never loads`,
        },
        {
          glob: '**/*',
          input: 'node_modules/@loomweaver/frame-kit/dist',
          from: 'workspace',
          output: 'frame-kit',
          without: 'without it the frame kit the plugin loads from /frame-kit/ is missing',
        },
      ],
    },
    {
      kind: 'compose-provider',
      providers: [
        {
          line: `...provideFramePlugins({ id: '${plugin.id}', name: ${stringLiteral(plugin.name)}, entryUrl: '${entryUrl}', capabilities: [${capabilities}] }),`,
          shell: ['provideFramePlugins'],
          unless: `'${entryUrl}'`,
        },
        {
          line: `provideCapabilityGrants({ ${grantKey(plugin.id)}: [${capabilities}] }),`,
          shell: ['provideCapabilityGrants'],
          unless: `${grantKey(plugin.id)}: [`,
        },
      ],
      without:
        'Without them the plugin is never loaded, and loaded without its grant every call it makes is refused.',
    },
  ];
}

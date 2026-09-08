import { Amendment } from '../../lib/amend/types';
import { joinProjectPath, normalizeProjectRoot } from '../../lib/amend/merge';
import {
  AuthSourceInput,
  resolveAuthSourceInput,
  SESSION_PLUGIN_ID,
  sessionPluginSymbol,
} from './recipe';

export function authSourceAmendments(
  input: AuthSourceInput,
  where: string | undefined,
): readonly Amendment[] {
  const a = resolveAuthSourceInput(input);
  if (a.bare || where === undefined || where === '') {
    return [];
  }
  const directory = normalizeProjectRoot(where);
  return [
    {
      kind: 'build-target',
      styles: [],
      assets: [
        {
          glob: '**/*.json',
          input: joinProjectPath(directory, 'i18n'),
          from: 'workspace',
          output: `i18n/${SESSION_PLUGIN_ID}`,
        },
      ],
    },
    {
      kind: 'compose-plugin',
      id: SESSION_PLUGIN_ID,
      symbol: sessionPluginSymbol(a),
      capabilities: ['contributions'],
      sourceRoot: directory,
      providers: [
        {
          line: `provideAuthSource(() => ${a.propertyName}AuthSource()),`,
          shell: ['provideAuthSource'],
          own: [`${a.propertyName}AuthSource`],
          unless: 'provideAuthSource(',
        },
        {
          line: 'provideIcons({ account: heroUserCircle, signOut: heroArrowRightStartOnRectangle }),',
          shell: ['provideIcons'],
          from: [
            {
              path: '@ng-icons/heroicons/outline',
              symbols: ['heroArrowRightStartOnRectangle', 'heroUserCircle'],
            },
          ],
        },
      ],
    },
  ];
}

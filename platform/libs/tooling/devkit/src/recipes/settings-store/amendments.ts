import { joinProjectPath, normalizeProjectRoot } from '../../lib/amend/merge';
import { Amendment } from '../../lib/amend/types';
import { resolveSettingsStoreInput, SettingsStoreInput } from './recipe';

export function settingsStoreAmendments(
  input: SettingsStoreInput,
  where: string | undefined,
): readonly Amendment[] {
  if (where === undefined || where === '') {
    return [];
  }
  const store = resolveSettingsStoreInput(input);
  const symbol = `${store.className}SettingsStore`;
  return [
    {
      kind: 'compose-provider',
      module: joinProjectPath(normalizeProjectRoot(where), `${store.name}-settings-store`),
      providers: [
        {
          line: `provideSettingsStore(new ${symbol}()),`,
          shell: ['provideSettingsStore'],
          own: [symbol],
          unless: 'provideSettingsStore(',
        },
      ],
      without:
        "Without it settings stay in the browser's local storage and never reach your API.",
    },
  ];
}

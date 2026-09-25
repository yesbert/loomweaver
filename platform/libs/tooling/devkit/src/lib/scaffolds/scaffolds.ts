import { distributionScaffold } from '../../recipes/angular-distribution/scaffold';
import { weaverScaffold } from '../../recipes/angular-weaver/scaffold';
import { authSourceScaffold } from '../../recipes/auth-source/scaffold';
import { framePluginScaffold } from '../../recipes/frame-plugin/scaffold';
import { layoutScaffold } from '../../recipes/layout/scaffold';
import { settingsStoreScaffold } from '../../recipes/settings-store/scaffold';
import { themeScaffold } from '../../recipes/theme/scaffold';
import { ScaffoldDescriptor } from './scaffold-values';

export const SCAFFOLDS: readonly ScaffoldDescriptor[] = [
  weaverScaffold,
  framePluginScaffold,
  distributionScaffold,
  authSourceScaffold,
  settingsStoreScaffold,
  themeScaffold,
  layoutScaffold,
];

export function findScaffold(name: string): ScaffoldDescriptor | undefined {
  return SCAFFOLDS.find((scaffold) => scaffold.name === name);
}

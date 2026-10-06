import { formatFiles, Tree } from '@nx/devkit';
import { generate } from '../../lib/generate/generate';
import { settingsStoreAmendments } from '../../recipes/settings-store/amendments';
import { settingsStore } from '../../recipes/settings-store/recipe';
import { applyAmendments } from '../apply-amendments';
import { resolveApp, writeFilesGuarded } from '../workspace-tree';
import { SettingsStoreGeneratorSchema } from './schema';

export async function settingsStoreGenerator(
  tree: Tree,
  options: SettingsStoreGeneratorSchema,
): Promise<void> {
  const app = resolveApp(tree, options.app);
  const root = options.directory ?? `${app.root}/src/settings`;
  const input = { name: options.name };
  writeFilesGuarded(tree, root, generate(settingsStore, input));
  applyAmendments(tree, settingsStoreAmendments(input, root), { app });
  await formatFiles(tree);
}

export default settingsStoreGenerator;

import { formatFiles, Tree } from '@nx/devkit';
import { generate } from '../../lib/generate/generate';
import { settingsStore } from '../../recipes/settings-store/recipe';
import { resolveApp, writeFilesGuarded } from '../shared';
import { SettingsStoreGeneratorSchema } from './schema';

export async function settingsStoreGenerator(
  tree: Tree,
  options: SettingsStoreGeneratorSchema,
): Promise<void> {
  const root = `${resolveApp(tree, options.app).root}/src/settings`;
  writeFilesGuarded(
    tree,
    root,
    generate(settingsStore, { name: options.name }),
  );
  await formatFiles(tree);
}

export default settingsStoreGenerator;

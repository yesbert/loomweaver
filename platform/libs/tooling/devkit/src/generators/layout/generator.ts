import { formatFiles, Tree } from '@nx/devkit';
import { generate } from '../../lib/generate/generate';
import { layout } from '../../recipes/layout/recipe';
import { resolveApp, writeFilesGuarded } from '../workspace-tree';
import { LayoutGeneratorSchema } from './schema';

export async function layoutGenerator(
  tree: Tree,
  options: LayoutGeneratorSchema,
): Promise<void> {
  const root = `${resolveApp(tree, options.app).root}/src`;
  writeFilesGuarded(tree, root, generate(layout, { name: options.name }));
  await formatFiles(tree);
}

export default layoutGenerator;

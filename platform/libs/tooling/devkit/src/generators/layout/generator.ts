import { formatFiles, Tree } from '@nx/devkit';
import { generate } from '../../lib/generate/generate';
import { layoutAmendments } from '../../recipes/layout/amendments';
import { layout } from '../../recipes/layout/recipe';
import { applyAmendments } from '../apply-amendments';
import { resolveApp, writeFilesGuarded } from '../workspace-tree';
import { LayoutGeneratorSchema } from './schema';

export async function layoutGenerator(
  tree: Tree,
  options: LayoutGeneratorSchema,
): Promise<void> {
  const app = resolveApp(tree, options.app);
  const root = options.directory ?? `${app.root}/src`;
  const input = { name: options.name };
  writeFilesGuarded(tree, root, generate(layout, input));
  applyAmendments(tree, layoutAmendments(input, root), { app });
  await formatFiles(tree);
}

export default layoutGenerator;

import { formatFiles, Tree } from '@nx/devkit';
import { generate } from '../../lib/generate/generate';
import { themeAmendments } from '../../recipes/theme/amendments';
import { theme } from '../../recipes/theme/recipe';
import { applyAmendments } from '../apply-amendments';
import { resolveApp, writeFilesGuarded } from '../workspace-tree';
import { ThemeGeneratorSchema } from './schema';

export async function themeGenerator(
  tree: Tree,
  options: ThemeGeneratorSchema,
): Promise<void> {
  const app = resolveApp(tree, options.app);
  const root = options.directory ?? `${app.root}/src/themes`;
  const input = { name: options.name, preset: options.preset };
  writeFilesGuarded(tree, root, generate(theme, input));
  applyAmendments(tree, themeAmendments(input, root), { app });
  await formatFiles(tree);
}

export default themeGenerator;

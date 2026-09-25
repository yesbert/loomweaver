import { formatFiles, Tree } from '@nx/devkit';
import { generate } from '../../lib/generate/generate';
import { theme } from '../../recipes/theme/recipe';
import { resolveApp, writeFilesGuarded } from '../workspace-tree';
import { ThemeGeneratorSchema } from './schema';

export async function themeGenerator(
  tree: Tree,
  options: ThemeGeneratorSchema,
): Promise<void> {
  const root = `${resolveApp(tree, options.app).root}/src/themes`;
  writeFilesGuarded(
    tree,
    root,
    generate(theme, { name: options.name, preset: options.preset }),
  );
  await formatFiles(tree);
}

export default themeGenerator;

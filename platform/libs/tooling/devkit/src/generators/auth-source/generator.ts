import { formatFiles, Tree } from '@nx/devkit';
import { generate } from '../../lib/generate/generate';
import { authSource } from '../../recipes/auth-source/recipe';
import { resolveApp, writeFilesGuarded } from '../shared';
import { AuthSourceGeneratorSchema } from './schema';

export async function authSourceGenerator(
  tree: Tree,
  options: AuthSourceGeneratorSchema,
): Promise<void> {
  const root = `${resolveApp(tree, options.app).root}/src/auth`;
  writeFilesGuarded(tree, root, generate(authSource, { name: options.name }));
  await formatFiles(tree);
}

export default authSourceGenerator;

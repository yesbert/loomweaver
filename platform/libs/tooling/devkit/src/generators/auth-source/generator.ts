import { posix } from 'node:path';
import { formatFiles, Tree } from '@nx/devkit';
import { generate } from '../../lib/generate/generate';
import { authSourceAmendments } from '../../recipes/auth-source/amendments';
import { authSource } from '../../recipes/auth-source/recipe';
import { applyAmendments } from '../apply-amendments';
import { resolveApp, writeFilesGuarded } from '../workspace-tree';
import { AuthSourceGeneratorSchema } from './schema';

export async function authSourceGenerator(
  tree: Tree,
  options: AuthSourceGeneratorSchema,
): Promise<void> {
  const app = resolveApp(tree, options.app);
  const root = options.directory ?? `${app.root}/src/auth`;
  const input = { name: options.name, bare: options.bare };
  writeFilesGuarded(tree, root, generate(authSource, input));
  applyAmendments(tree, authSourceAmendments(input, root), {
    app,
    importPath: relativeImport(`${app.root}/src/app`, root),
  });
  await formatFiles(tree);
}

function relativeImport(fromDirectory: string, toDirectory: string): string {
  const path = posix.relative(fromDirectory, toDirectory);
  if (path === '') {
    return '.';
  }
  return path.startsWith('..') ? path : `./${path}`;
}

export default authSourceGenerator;

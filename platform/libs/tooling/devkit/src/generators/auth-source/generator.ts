import { formatFiles, Tree } from '@nx/devkit';
import { composePlugin } from '../../lib/amend/compose';
import { generate } from '../../lib/generate/generate';
import { authSourceAmendments } from '../../recipes/auth-source/recipe-amendments';
import { authSource } from '../../recipes/auth-source/recipe';
import { addI18nAssetsGlob, resolveApp, writeFilesGuarded } from '../shared';
import { AuthSourceGeneratorSchema } from './schema';

export async function authSourceGenerator(
  tree: Tree,
  options: AuthSourceGeneratorSchema,
): Promise<void> {
  const app = resolveApp(tree, options.app);
  const root = options.directory ?? `${app.root}/src/auth`;
  const input = { name: options.name, bare: options.bare };
  writeFilesGuarded(tree, root, generate(authSource, input));
  for (const amendment of authSourceAmendments(input, root)) {
    if (amendment.kind === 'build-target') {
      for (const asset of amendment.assets) {
        addI18nAssetsGlob(tree, app.name, {
          input: asset.input,
          output: asset.output ?? '',
        });
      }
    } else if (amendment.kind === 'compose-plugin') {
      composeIntoApp(tree, app.root, root, amendment);
    }
  }
  await formatFiles(tree);
}

function composeIntoApp(
  tree: Tree,
  appRoot: string,
  sourceRoot: string,
  amendment: Parameters<typeof composePlugin>[1],
): void {
  const config = `${appRoot}/src/app/app.config.ts`;
  const source = tree.read(config, 'utf8');
  if (source === null) {
    return;
  }
  const importPath = relativeImport(`${appRoot}/src/app`, sourceRoot);
  const result = composePlugin(source, amendment, importPath);
  if (result.composed && result.source !== source) {
    tree.write(config, result.source);
  }
}

function relativeImport(fromDir: string, toDir: string): string {
  const from = fromDir.split('/').filter(Boolean);
  const to = toDir.split('/').filter(Boolean);
  let shared = 0;
  while (shared < from.length && shared < to.length && from[shared] === to[shared]) {
    shared += 1;
  }
  const up = from.slice(shared).map(() => '..');
  const down = to.slice(shared);
  const parts = [...up, ...down];
  if (parts.length === 0) {
    return '.';
  }
  const rooted = parts[0] === '..' ? parts : ['.', ...parts];
  return rooted.join('/');
}

export default authSourceGenerator;

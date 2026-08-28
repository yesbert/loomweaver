import { formatFiles, Tree } from '@nx/devkit';
import { generate } from '../../lib/generate/generate';
import { framePlugin } from '../../recipes/frame-plugin/recipe';
import { resolveApp, writeFiles } from '../shared';
import { SandboxPluginGeneratorSchema } from './schema';

export async function framePluginGenerator(
  tree: Tree,
  options: SandboxPluginGeneratorSchema,
): Promise<void> {
  const root = `${resolveApp(tree, options.app).root}/public/${options.id}`;
  if (tree.exists(`${root}/plugin.html`)) {
    throw new Error(`A frame plugin already exists at ${root}.`);
  }

  writeFiles(
    tree,
    root,
    generate(framePlugin, { id: options.id, name: options.name }),
  );

  await formatFiles(tree);
}

export default framePluginGenerator;

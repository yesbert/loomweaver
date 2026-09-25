import { formatFiles, Tree } from '@nx/devkit';
import { generate } from '../../lib/generate/generate';
import { framePlugin } from '../../recipes/frame-plugin/recipe';
import { resolveApp, writeFilesGuarded } from '../workspace-tree';
import { FramePluginGeneratorSchema } from './schema';

export async function framePluginGenerator(
  tree: Tree,
  options: FramePluginGeneratorSchema,
): Promise<void> {
  const root = `${resolveApp(tree, options.app).root}/public/${options.id}`;
  writeFilesGuarded(
    tree,
    root,
    generate(framePlugin, { id: options.id, name: options.name }),
  );

  await formatFiles(tree);
}

export default framePluginGenerator;

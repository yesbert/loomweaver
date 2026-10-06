import { formatFiles, GeneratorCallback, Tree } from '@nx/devkit';
import { generate } from '../../lib/generate/generate';
import { framePluginAmendments } from '../../recipes/frame-plugin/amendments';
import { framePlugin } from '../../recipes/frame-plugin/recipe';
import { applyAmendments } from '../apply-amendments';
import { resolveApp, writeFilesGuarded } from '../workspace-tree';
import { FramePluginGeneratorSchema } from './schema';

export async function framePluginGenerator(
  tree: Tree,
  options: FramePluginGeneratorSchema,
): Promise<GeneratorCallback | undefined> {
  const app = resolveApp(tree, options.app);
  const root = options.directory ?? `${app.root}/public/${options.id}`;
  const input = { id: options.id, name: options.name };
  writeFilesGuarded(tree, root, generate(framePlugin, input));
  const install = applyAmendments(tree, framePluginAmendments(input, root), { app });
  await formatFiles(tree);
  return install;
}

export default framePluginGenerator;

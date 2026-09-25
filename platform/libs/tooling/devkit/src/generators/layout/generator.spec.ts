import { Tree } from '@nx/devkit';
import { createConsumerWorkspace } from '../test-workspace';
import { layoutGenerator } from './generator';

describe('layout generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createConsumerWorkspace();
  });

  it('writes into the resolved application', async () => {
    await layoutGenerator(tree, {});
    expect(tree.exists('apps/studio/src/base-layout.ts')).toBe(true);
  });
});

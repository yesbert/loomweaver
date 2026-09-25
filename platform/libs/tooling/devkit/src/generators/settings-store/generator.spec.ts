import { Tree } from '@nx/devkit';
import { createConsumerWorkspace } from '../test-workspace';
import { settingsStoreGenerator } from './generator';

describe('settings-store generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createConsumerWorkspace();
  });

  it('writes into the resolved application', async () => {
    await settingsStoreGenerator(tree, { name: 'backend' });
    expect(
      tree.exists('apps/studio/src/settings/backend-settings-store.ts'),
    ).toBe(true);
  });
});

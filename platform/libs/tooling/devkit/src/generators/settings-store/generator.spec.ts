import { Tree } from '@nx/devkit';
import { addApp, createConsumerWorkspace } from '../test-workspace';
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

  it("follows the application's own root rather than assuming apps/", async () => {
    const nested = createConsumerWorkspace('studio', 'packages/apps/studio');
    await settingsStoreGenerator(nested, { name: 'backend' });
    expect(
      nested.exists(
        'packages/apps/studio/src/settings/backend-settings-store.ts',
      ),
    ).toBe(true);
  });

  it('refuses to overwrite', async () => {
    await settingsStoreGenerator(tree, { name: 'backend' });
    await expect(
      settingsStoreGenerator(tree, { name: 'backend' }),
    ).rejects.toThrow(/already exists/);
  });

  it('names the candidates when the workspace has several applications', async () => {
    const many = createConsumerWorkspace('one', 'apps/one');
    addApp(many, 'two');
    await expect(
      settingsStoreGenerator(many, { name: 'backend' }),
    ).rejects.toThrow(/one, two/);
  });
});

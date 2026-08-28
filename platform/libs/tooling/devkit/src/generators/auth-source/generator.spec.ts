import { Tree } from '@nx/devkit';
import { addApp, createConsumerWorkspace } from '../test-workspace';
import { authSourceGenerator } from './generator';

describe('auth-source generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createConsumerWorkspace();
  });

  it('writes into the resolved application', async () => {
    await authSourceGenerator(tree, { name: 'dev' });
    expect(tree.exists('apps/studio/src/auth/dev-auth-source.ts')).toBe(true);
  });

  it("follows the application's own root rather than assuming apps/", async () => {
    const nested = createConsumerWorkspace('studio', 'packages/apps/studio');
    await authSourceGenerator(nested, { name: 'dev' });
    expect(
      nested.exists('packages/apps/studio/src/auth/dev-auth-source.ts'),
    ).toBe(true);
  });

  it('refuses to overwrite', async () => {
    await authSourceGenerator(tree, { name: 'dev' });
    await expect(authSourceGenerator(tree, { name: 'dev' })).rejects.toThrow(
      /already exists/,
    );
  });

  it('names the candidates when the workspace has several applications', async () => {
    const many = createConsumerWorkspace('one', 'apps/one');
    addApp(many, 'two');
    await expect(authSourceGenerator(many, { name: 'dev' })).rejects.toThrow(
      /one, two/,
    );
  });
});

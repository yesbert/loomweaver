import { Tree } from '@nx/devkit';
import { addApp, createConsumerWorkspace } from '../test-workspace';
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

  it("follows the application's own root rather than assuming apps/", async () => {
    const nested = createConsumerWorkspace('studio', 'packages/apps/studio');
    await layoutGenerator(nested, {});
    expect(nested.exists('packages/apps/studio/src/base-layout.ts')).toBe(true);
  });

  it('refuses to overwrite', async () => {
    await layoutGenerator(tree, {});
    await expect(layoutGenerator(tree, {})).rejects.toThrow(/already exists/);
  });

  it('names the candidates when the workspace has several applications', async () => {
    const many = createConsumerWorkspace('one', 'apps/one');
    addApp(many, 'two');
    await expect(layoutGenerator(many, {})).rejects.toThrow(/one, two/);
  });

  it('still infers the one buildable app beside its e2e project', async () => {
    const withE2e = createConsumerWorkspace('shop', 'apps/shop');
    addApp(withE2e, 'shop-e2e', { buildable: false });
    await layoutGenerator(withE2e, {});
    expect(withE2e.exists('apps/shop/src/base-layout.ts')).toBe(true);
  });

  it('refuses an application that builds nothing', async () => {
    addApp(tree, 'studio-e2e', { buildable: false });
    await expect(layoutGenerator(tree, { app: 'studio-e2e' })).rejects.toThrow(
      /no build target/,
    );
  });
});

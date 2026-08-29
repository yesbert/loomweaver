import { Tree } from '@nx/devkit';
import { addApp, createConsumerWorkspace } from '../test-workspace';
import { themeGenerator } from './generator';

describe('theme generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createConsumerWorkspace();
  });

  it('writes into the resolved application', async () => {
    await themeGenerator(tree, { name: 'midnight' });
    expect(tree.exists('apps/studio/src/themes/midnight.css')).toBe(true);
  });

  it('honours the preset', async () => {
    await themeGenerator(tree, { name: 'acme', preset: 'bootstrap' });
    const css = tree.read('apps/studio/src/themes/acme.css', 'utf8') ?? '';
    expect(css).toContain('var(--bs-primary)');
  });

  it("follows the application's own root rather than assuming apps/", async () => {
    const nested = createConsumerWorkspace('studio', 'packages/apps/studio');
    await themeGenerator(nested, { name: 'midnight' });
    expect(nested.exists('packages/apps/studio/src/themes/midnight.css')).toBe(
      true,
    );
  });

  it('refuses to overwrite', async () => {
    await themeGenerator(tree, { name: 'midnight' });
    await expect(themeGenerator(tree, { name: 'midnight' })).rejects.toThrow(
      /already exists/,
    );
  });

  it('names the candidates when the workspace has several applications', async () => {
    const many = createConsumerWorkspace('one', 'apps/one');
    addApp(many, 'two');
    await expect(themeGenerator(many, { name: 'midnight' })).rejects.toThrow(
      /one, two/,
    );
  });
});

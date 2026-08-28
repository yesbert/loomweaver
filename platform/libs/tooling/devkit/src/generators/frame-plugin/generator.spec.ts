import { Tree } from '@nx/devkit';
import { createConsumerWorkspace } from '../test-workspace';
import { framePluginGenerator } from './generator';

describe('frame-plugin generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createConsumerWorkspace();
  });

  it('writes the plugin files into the resolved application', async () => {
    await framePluginGenerator(tree, { id: 'notes' });
    const root = 'apps/studio/public/notes';
    expect(tree.exists(`${root}/plugin.html`)).toBe(true);
    expect(tree.exists(`${root}/plugin.js`)).toBe(true);
    expect(tree.exists(`${root}/view.html`)).toBe(true);
    expect(tree.read(`${root}/plugin.js`, 'utf-8')).toContain(
      '/notes/view.html',
    );
  });

  it("follows the application's own root rather than assuming apps/", async () => {
    const nested = createConsumerWorkspace('studio', 'packages/apps/studio');
    await framePluginGenerator(nested, { id: 'notes' });
    expect(nested.exists('packages/apps/studio/public/notes/plugin.html')).toBe(
      true,
    );
  });

  it('refuses to overwrite an existing plugin', async () => {
    await framePluginGenerator(tree, { id: 'notes' });
    await expect(framePluginGenerator(tree, { id: 'notes' })).rejects.toThrow(
      /already exists/,
    );
  });
});

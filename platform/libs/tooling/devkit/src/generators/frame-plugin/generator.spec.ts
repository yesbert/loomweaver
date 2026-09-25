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
    expect(tree.read(`${root}/plugin.js`, 'utf8')).toContain(
      '/notes/view.html',
    );
  });
});

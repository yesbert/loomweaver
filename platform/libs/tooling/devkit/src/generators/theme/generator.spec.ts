import { Tree } from '@nx/devkit';
import { createConsumerWorkspace } from '../test-workspace';
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
});

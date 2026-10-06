import { Tree } from '@nx/devkit';
import {
  createConsumerWorkspace,
  createGeneratedDistribution,
  GENERATED_APP,
} from '../test-workspace';
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

describe('theme generator in a generated distribution', () => {
  it('imports the theme after the shell styles, so it takes effect', async () => {
    const tree = await createGeneratedDistribution();

    await themeGenerator(tree, { name: 'midnight', app: 'acme-studio' });

    const css = tree.read(`${GENERATED_APP}/src/styles.css`, 'utf8') ?? '';
    const lines = css.split('\n');
    const shell = lines.findIndex((line) => line.includes('@loomweaver/shell/styles/'));
    expect(shell).toBeGreaterThanOrEqual(0);
    expect(lines[shell + 1]).toBe("@import './themes/midnight.css';");
  });

  it('imports it once however often it is generated', async () => {
    const tree = await createGeneratedDistribution();

    await themeGenerator(tree, { name: 'midnight', app: 'acme-studio' });
    tree.delete(`${GENERATED_APP}/src/themes/midnight.css`);
    await themeGenerator(tree, { name: 'midnight', app: 'acme-studio' });

    const css = tree.read(`${GENERATED_APP}/src/styles.css`, 'utf8') ?? '';
    expect(css.match(/themes\/midnight\.css/g)).toHaveLength(1);
  });
});

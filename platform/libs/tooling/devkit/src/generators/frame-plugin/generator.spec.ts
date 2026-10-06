import { readJson, Tree } from '@nx/devkit';
import {
  createConsumerWorkspace,
  createGeneratedDistribution,
  GENERATED_APP,
} from '../test-workspace';
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

describe('frame-plugin generator in a generated distribution', () => {
  it('registers and grants the plugin, served from the public folder it lands in', async () => {
    const tree = await createGeneratedDistribution();
    const assetsBefore = readJson(tree, `${GENERATED_APP}/project.json`).targets.build.options
      .assets;

    await framePluginGenerator(tree, { id: 'field-notes', app: 'acme-studio' });

    const config = tree.read(`${GENERATED_APP}/src/app/app.config.ts`, 'utf8') ?? '';
    const flat = config.replaceAll(/\s+/g, ' ');
    expect(flat).toContain(
      "...provideFramePlugins({ id: 'field-notes', name: 'Field Notes', entryUrl: '/field-notes/plugin.html', capabilities: ['contributions', 'ui'], })",
    );
    expect(flat).toContain(
      "provideCapabilityGrants({ 'field-notes': ['contributions', 'ui'] })",
    );
    expect(config).toMatch(/import \{[^}]*provideFramePlugins[^}]*\} from '@loomweaver\/shell'/);
    expect(readJson(tree, `${GENERATED_APP}/project.json`).targets.build.options.assets).toEqual(
      assetsBefore,
    );
  });

  it('serves files placed outside the public folder under the plugin id', async () => {
    const tree = await createGeneratedDistribution();

    await framePluginGenerator(tree, {
      id: 'notes',
      app: 'acme-studio',
      directory: 'plugins/notes',
    });

    const assets = readJson(tree, `${GENERATED_APP}/project.json`).targets.build.options.assets;
    expect(assets).toContainEqual({ glob: '**/*', input: 'plugins/notes', output: 'notes' });
  });

  it('registers it once however often it is generated', async () => {
    const tree = await createGeneratedDistribution();

    await framePluginGenerator(tree, { id: 'notes', app: 'acme-studio' });
    for (const file of ['plugin.html', 'plugin.js', 'view.html', 'README.md']) {
      tree.delete(`${GENERATED_APP}/public/notes/${file}`);
    }
    await framePluginGenerator(tree, { id: 'notes', app: 'acme-studio' });

    const config = tree.read(`${GENERATED_APP}/src/app/app.config.ts`, 'utf8') ?? '';
    expect(config.match(/provideFramePlugins\(/g)).toHaveLength(1);
    expect(config.match(/notes: \['contributions', 'ui'\]/g)).toHaveLength(1);
  });
});

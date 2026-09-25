import { Tree } from '@nx/devkit';
import { authSourceGenerator } from './auth-source/generator';
import { framePluginGenerator } from './frame-plugin/generator';
import { layoutGenerator } from './layout/generator';
import { settingsStoreGenerator } from './settings-store/generator';
import { addApp, createConsumerWorkspace } from './test-workspace';
import { themeGenerator } from './theme/generator';

interface FileGenerator {
  readonly name: string;
  readonly run: (tree: Tree) => Promise<unknown>;
  readonly writes: string;
  readonly namesCandidates: boolean;
}

const GENERATORS: readonly FileGenerator[] = [
  {
    name: 'auth-source',
    run: (tree) => authSourceGenerator(tree, { name: 'dev' }),
    writes: 'src/auth/dev-auth-source.ts',
    namesCandidates: true,
  },
  {
    name: 'frame-plugin',
    run: (tree) => framePluginGenerator(tree, { id: 'notes' }),
    writes: 'public/notes/plugin.html',
    namesCandidates: false,
  },
  {
    name: 'layout',
    run: (tree) => layoutGenerator(tree, {}),
    writes: 'src/base-layout.ts',
    namesCandidates: true,
  },
  {
    name: 'settings-store',
    run: (tree) => settingsStoreGenerator(tree, { name: 'backend' }),
    writes: 'src/settings/backend-settings-store.ts',
    namesCandidates: true,
  },
  {
    name: 'theme',
    run: (tree) => themeGenerator(tree, { name: 'midnight' }),
    writes: 'src/themes/midnight.css',
    namesCandidates: true,
  },
];

describe.each(GENERATORS)('the $name generator', (generator) => {
  it("follows the application's own root rather than assuming apps/", async () => {
    const nested = createConsumerWorkspace('studio', 'packages/apps/studio');
    await generator.run(nested);
    expect(nested.exists(`packages/apps/studio/${generator.writes}`)).toBe(true);
  });

  it('refuses to overwrite', async () => {
    const tree = createConsumerWorkspace();
    await generator.run(tree);
    await expect(generator.run(tree)).rejects.toThrow(/already exists/);
  });
});

describe.each(GENERATORS.filter((generator) => generator.namesCandidates))(
  'the $name generator in a workspace with several applications',
  (generator) => {
    it('names the candidates', async () => {
      const many = createConsumerWorkspace('one', 'apps/one');
      addApp(many, 'two');
      await expect(generator.run(many)).rejects.toThrow(/one, two/);
    });
  },
);

describe('the application a generator writes into', () => {
  it('is still inferred beside its e2e project', async () => {
    const withE2e = createConsumerWorkspace('shop', 'apps/shop');
    addApp(withE2e, 'shop-e2e', { buildable: false });
    await layoutGenerator(withE2e, {});
    expect(withE2e.exists('apps/shop/src/base-layout.ts')).toBe(true);
  });

  it('must build something', async () => {
    const tree = createConsumerWorkspace();
    addApp(tree, 'studio-e2e', { buildable: false });
    await expect(layoutGenerator(tree, { app: 'studio-e2e' })).rejects.toThrow(
      /no build target/,
    );
  });
});

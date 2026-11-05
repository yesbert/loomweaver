import { addProjectConfiguration, logger, Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { authSourceGenerator } from './auth-source/generator';
import { framePluginGenerator } from './frame-plugin/generator';
import { layoutGenerator } from './layout/generator';
import { settingsStoreGenerator } from './settings-store/generator';
import { themeGenerator } from './theme/generator';

const DOTTED_PATH = /\.\/(src|public)|\/\.\//;

describe('generating into an application at the workspace root', () => {
  it.each([
    [
      'auth-source',
      'src/auth/index.ts',
      (tree: Tree) => authSourceGenerator(tree, { name: 'dev' }),
    ],
    [
      'layout',
      'src/wide-layout.ts',
      (tree: Tree) => layoutGenerator(tree, { name: 'wide' }),
    ],
    [
      'theme',
      'src/themes/midnight.css',
      (tree: Tree) => themeGenerator(tree, { name: 'midnight' }),
    ],
    [
      'settings-store',
      'src/settings/api-settings-store.ts',
      (tree: Tree) => settingsStoreGenerator(tree, { name: 'api' }),
    ],
    [
      'frame-plugin',
      'public/charts/plugin.html',
      (tree: Tree) => framePluginGenerator(tree, { id: 'charts' }),
    ],
  ])(
    '%s writes %s and names no path with a leading dot',
    async (_name, file, generate) => {
      const tree = createTreeWithEmptyWorkspace({ formatter: 'prettier' });
      addProjectConfiguration(tree, 'studio', {
        root: '.',
        projectType: 'application',
        targets: { build: { options: { styles: ['src/styles.css'] } } },
      });
      tree.write(
        'src/styles.css',
        "@import '@loomweaver/shell/styles/shell.css';\n",
      );
      const warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);

      await generate(tree);

      expect(tree.exists(file)).toBe(true);
      const written = tree
        .listChanges()
        .map((change) => change.content?.toString() ?? '');
      const said = warn.mock.calls.map(([message]) => String(message));
      expect(
        [...written, ...said].flatMap((text) =>
          text.split('\n').filter((line) => DOTTED_PATH.test(line)),
        ),
      ).toEqual([]);
      warn.mockRestore();
    },
  );
});

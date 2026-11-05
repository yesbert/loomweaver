import {
  addProjectConfiguration,
  logger,
  Tree,
  readJson,
  updateJson,
} from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { distributionGenerator } from './generator';

describe('distribution generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace({ formatter: 'prettier' });
  });

  it('sets an initial-bundle budget the workbench fits and a product can still exceed', async () => {
    await distributionGenerator(tree, {
      name: 'acme-studio',
      title: 'Acme Studio',
    });

    const project = readJson(tree, 'apps/acme-studio/project.json');
    const budgets = project.targets.build.configurations.production.budgets;
    const initial = budgets.find(
      (budget: { type: string }) => budget.type === 'initial',
    );
    expect(initial).toEqual({
      type: 'initial',
      maximumWarning: '1.5MB',
      maximumError: '2MB',
    });
  });

  it('records the frame kit the generated build serves, and hands back the install', async () => {
    const install = await distributionGenerator(tree, {
      name: 'acme-studio',
      title: 'Acme Studio',
    });

    const manifest = readJson(tree, 'package.json');
    expect(manifest.dependencies['@loomweaver/frame-kit']).toMatch(/^\^\d+\.\d+\.\d+/);
    expect(install).toEqual(expect.any(Function));
  });

  it('scaffolds a runnable distribution app', async () => {
    await distributionGenerator(tree, {
      name: 'acme-studio',
      title: 'Acme Studio',
    });
    const root = 'apps/acme-studio';

    expect(tree.exists(`${root}/project.json`)).toBe(true);
    expect(tree.exists(`${root}/src/main.ts`)).toBe(true);
    expect(tree.exists(`${root}/src/index.html`)).toBe(true);
    expect(tree.exists(`${root}/src/styles.css`)).toBe(true);
    expect(tree.exists(`${root}/public/manifest.webmanifest`)).toBe(true);

    const project = readJson(tree, `${root}/project.json`);
    expect(project.name).toBe('acme-studio');
    expect(project.projectType).toBe('application');
    expect(project.tags).toEqual([]);
    expect(project.targets.build.options.browser).toBe(
      'apps/acme-studio/src/main.ts',
    );
    expect(project.targets.test.executor).toBe('@nx/angular:unit-test');
  });

  it('emits no project-level test setup — the builder owns the TestBed', async () => {
    await distributionGenerator(tree, { name: 'acme-studio' });
    expect(tree.exists('apps/acme-studio/src/test-setup.ts')).toBe(false);
  });

  it('honours the styles option', async () => {
    await distributionGenerator(tree, {
      name: 'acme-studio',
      styles: 'precompiled',
    });
    const styles = tree.read('apps/acme-studio/src/styles.css', 'utf8') ?? '';
    expect(styles).toContain("@import '@loomweaver/shell/styles/shell.css'");
    expect(styles).not.toContain('tailwindcss');
  });

  it('gives the test target something to run', async () => {
    await distributionGenerator(tree, { name: 'acme-studio' });
    expect(tree.exists('apps/acme-studio/src/app/app.config.spec.ts')).toBe(
      true,
    );
    expect(tree.read('apps/acme-studio/src/app/app.spec.ts', 'utf8')).toContain(
      "querySelector('lw-shell')",
    );
  });

  it('leaves no spec behind when the workspace runs no unit tests', async () => {
    await distributionGenerator(tree, {
      name: 'acme-studio',
      unitTestRunner: 'none',
    });
    expect(tree.exists('apps/acme-studio/src/app/app.config.spec.ts')).toBe(
      false,
    );
    expect(tree.exists('apps/acme-studio/src/app/app.spec.ts')).toBe(false);
    expect(
      readJson(tree, 'apps/acme-studio/project.json').targets.test,
    ).toBeUndefined();
  });

  it('declares app as its prefix when none is supplied, and lints it once', async () => {
    await distributionGenerator(tree, { name: 'acme-studio' });
    expect(readJson(tree, 'apps/acme-studio/project.json').prefix).toBe('app');
    expect(tree.read('apps/acme-studio/eslint.config.mjs', 'utf8')).toContain(
      "prefix: 'app'",
    );
  });

  it("keeps Angular's app-root lintable beside the project prefix", async () => {
    await distributionGenerator(tree, { name: 'acme-studio', prefix: 'ac' });
    const eslint = tree.read('apps/acme-studio/eslint.config.mjs', 'utf8');
    expect(eslint).toContain("prefix: ['ac', 'app']");
    expect(tree.read('apps/acme-studio/src/app/app.ts', 'utf8')).toContain(
      "selector: 'app-root'",
    );
  });

  it('honours an explicit directory, tags and prefix', async () => {
    await distributionGenerator(tree, {
      name: 'acme-studio',
      directory: 'packages/apps/studio',
      tags: 'scope:product, type:app',
      prefix: 'ac',
    });

    const project = readJson(tree, 'packages/apps/studio/project.json');
    expect(project.prefix).toBe('ac');
    expect(project.tags).toEqual(['scope:product', 'type:app']);
    expect(project.targets.build.options.outputPath).toBe(
      'dist/packages/apps/studio',
    );
    expect(readJson(tree, 'packages/apps/studio/tsconfig.json').extends).toBe(
      '../../../tsconfig.base.json',
    );
  });

  it('refuses to overwrite an existing project', async () => {
    await distributionGenerator(tree, { name: 'acme-studio' });
    await expect(
      distributionGenerator(tree, { name: 'acme-studio' }),
    ).rejects.toThrow(/already exists/);
  });

  it('refuses to write over a file that is already there, and leaves it as it was', async () => {
    tree.write('apps/acme-studio/src/main.ts', 'keep me');
    await expect(
      distributionGenerator(tree, { name: 'acme-studio' }),
    ).rejects.toThrow(/apps\/acme-studio\/src\/main\.ts already exists/);
    expect(tree.read('apps/acme-studio/src/main.ts', 'utf8')).toBe('keep me');
  });

  it('refuses a directory outside the workspace', async () => {
    await expect(
      distributionGenerator(tree, { name: 'acme-studio', directory: '../studio' }),
    ).rejects.toThrow(/outside the workspace/);
  });

  describe('composing into an application that already exists', () => {
    beforeEach(() => {
      addProjectConfiguration(tree, 'acme-studio', {
        root: 'apps/acme-studio',
        projectType: 'application',
        tags: ['scope:acme'],
        implicitDependencies: ['shared-config'],
        targets: {
          build: { executor: '@angular/build:application', options: {} },
          'my-own-target': { executor: 'nx:run-commands' },
        },
      });
    });

    it('names --force as the way through', async () => {
      await expect(
        distributionGenerator(tree, { name: 'acme-studio' }),
      ).rejects.toThrow(/Pass --force/);
    });

    it('writes the composition root into it', async () => {
      await distributionGenerator(tree, { name: 'acme-studio', force: true });

      expect(tree.exists('apps/acme-studio/src/main.ts')).toBe(true);
      expect(tree.exists('apps/acme-studio/src/styles.css')).toBe(true);
      const project = readJson(tree, 'apps/acme-studio/project.json');
      expect(project.targets.build.options.serviceWorker).toBe(
        'apps/acme-studio/ngsw-config.json',
      );
      expect(project.targets.build.options.styles).toEqual([
        'apps/acme-studio/src/styles.css',
      ]);
    });

    it('leaves what the occupant declared for itself', async () => {
      await distributionGenerator(tree, { name: 'acme-studio', force: true });

      const project = readJson(tree, 'apps/acme-studio/project.json');
      expect(project.targets['my-own-target']).toEqual({
        executor: 'nx:run-commands',
      });
      expect(project.implicitDependencies).toEqual(['shared-config']);
      expect(project.tags).toEqual(['scope:acme']);
    });

    it('leaves the TypeScript and lint configuration the application already has', async () => {
      const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
      const own: Record<string, string> = {
        'tsconfig.json': json({
          extends: '../../tsconfig.base.json',
          compilerOptions: { strict: false },
        }),
        'tsconfig.app.json': json({ extends: './tsconfig.json', files: [] }),
        'tsconfig.spec.json': json({ extends: './tsconfig.json', files: [] }),
        'eslint.config.mjs':
          "export default [{ rules: { 'no-console': 'off' } }];\n",
      };
      for (const [name, content] of Object.entries(own)) {
        tree.write(`apps/acme-studio/${name}`, content);
      }

      await distributionGenerator(tree, { name: 'acme-studio', force: true });

      for (const [name, content] of Object.entries(own)) {
        expect(tree.read(`apps/acme-studio/${name}`, 'utf8'), name).toBe(content);
      }
    });

    it('writes the configuration the application lacks', async () => {
      tree.write('apps/acme-studio/tsconfig.json', '{}\n');

      await distributionGenerator(tree, { name: 'acme-studio', force: true });

      expect(tree.read('apps/acme-studio/tsconfig.json', 'utf8')).toBe('{}\n');
      expect(tree.exists('apps/acme-studio/tsconfig.app.json')).toBe(true);
      expect(tree.exists('apps/acme-studio/eslint.config.mjs')).toBe(true);
    });

    describe('whose build target carries settings of its own', () => {
      const brandAsset = {
        glob: '**/*',
        input: 'apps/acme-studio/brand',
        output: 'brand',
      };
      const fileReplacements = [
        {
          replace: 'apps/acme-studio/src/environment.ts',
          with: 'apps/acme-studio/src/environment.prod.ts',
        },
      ];

      beforeEach(() => {
        updateJson(tree, 'apps/acme-studio/project.json', (project) => ({
          ...project,
          prefix: 'acme',
          sourceRoot: 'apps/acme-studio/src',
          targets: {
            ...project.targets,
            build: {
              executor: '@angular/build:application',
              options: {
                outputPath: 'dist/custom/acme-studio',
                browser: 'apps/acme-studio/src/main.ts',
                tsConfig: 'apps/acme-studio/tsconfig.app.json',
                assets: [brandAsset],
                styles: ['apps/acme-studio/src/styles.css'],
              },
              configurations: {
                production: {
                  fileReplacements,
                  budgets: [
                    {
                      type: 'initial',
                      maximumWarning: '500kb',
                      maximumError: '1mb',
                    },
                  ],
                },
                staging: { outputHashing: 'none' },
              },
            },
          },
        }));
      });

      it('keeps every value the occupant chose', async () => {
        await distributionGenerator(tree, { name: 'acme-studio', force: true });

        const project = readJson(tree, 'apps/acme-studio/project.json');
        expect(project.prefix).toBe('acme');
        expect(project.sourceRoot).toBe('apps/acme-studio/src');
        const build = project.targets.build;
        expect(build.options.outputPath).toBe('dist/custom/acme-studio');
        expect(build.options.assets).toContainEqual(brandAsset);
        expect(build.configurations.production.fileReplacements).toEqual(
          fileReplacements,
        );
        expect(build.configurations.staging).toEqual({ outputHashing: 'none' });
      });

      it('adds what the workbench needs beside them', async () => {
        await distributionGenerator(tree, { name: 'acme-studio', force: true });

        const build = readJson(tree, 'apps/acme-studio/project.json').targets
          .build;
        expect(build.options.assets).toContainEqual({
          glob: '**/*',
          input: 'node_modules/@loomweaver/shell/i18n',
          output: 'i18n',
        });
        expect(build.options.serviceWorker).toBe(
          'apps/acme-studio/ngsw-config.json',
        );
        expect(build.configurations.production.budgets).toEqual([
          { type: 'initial', maximumWarning: '1.5MB', maximumError: '2MB' },
        ]);
        expect(
          build.configurations.production.optimization.styles.inlineCritical,
        ).toBe(false);
      });
    });

    it('names a setting it could not add beside the occupant', async () => {
      updateJson(tree, 'apps/acme-studio/project.json', (project) => ({
        ...project,
        targets: {
          ...project.targets,
          build: {
            ...project.targets.build,
            configurations: { production: { optimization: true } },
          },
        },
      }));
      const warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);

      await distributionGenerator(tree, { name: 'acme-studio', force: true });

      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('inlineCritical cannot be set'),
      );
      warn.mockRestore();
    });

    it('refuses to rename the project out from under the workspace', async () => {
      await expect(
        distributionGenerator(tree, {
          name: 'other-studio',
          directory: 'apps/acme-studio',
          force: true,
        }),
      ).rejects.toThrow(/is named "acme-studio"/);
    });
  });

  describe('composing into an application at the workspace root', () => {
    beforeEach(() => {
      addProjectConfiguration(tree, 'acme-studio', {
        root: '.',
        projectType: 'application',
        targets: {
          build: { executor: '@angular/build:application', options: {} },
        },
      });
    });

    it.each(['', '.'])(
      'writes paths that resolve from the root when the directory is "%s"',
      async (directory) => {
        await distributionGenerator(tree, {
          name: 'acme-studio',
          directory,
          force: true,
        });

        expect(readJson(tree, 'tsconfig.json').extends).toBe(
          './tsconfig.base.json',
        );
        expect(readJson(tree, 'tsconfig.app.json').compilerOptions.outDir).toBe(
          './dist/out-tsc',
        );
        const options = readJson(tree, 'project.json').targets.build.options;
        expect(options.serviceWorker).toBe('ngsw-config.json');
        expect(options.browser).toBe('src/main.ts');
        expect(options.styles).toEqual(['src/styles.css']);
        expect(tree.exists('src/main.ts')).toBe(true);
      },
    );
  });

  it('gives a root-level application no configuration that extends or imports itself', async () => {
    tree.delete('tsconfig.base.json');
    addProjectConfiguration(tree, 'acme-studio', {
      root: '.',
      projectType: 'application',
      targets: {
        build: { executor: '@angular/build:application', options: {} },
      },
    });

    await distributionGenerator(tree, {
      name: 'acme-studio',
      directory: '.',
      force: true,
    });

    expect(readJson(tree, 'tsconfig.json').extends).toBeUndefined();
    expect(readJson(tree, 'tsconfig.app.json').extends).toBe('./tsconfig.json');
    expect(tree.read('eslint.config.mjs', 'utf8')).not.toContain(
      "from './eslint.config.mjs'",
    );
  });

  it('writes the style pipeline the generated stylesheet needs', async () => {
    await distributionGenerator(tree, { name: 'acme-studio' });
    expect(JSON.parse(tree.read('.postcssrc.json', 'utf8') as string)).toEqual({
      plugins: { '@tailwindcss/postcss': {} },
    });
  });

  it('leaves the style pipeline alone for a stylesheet that needs none', async () => {
    await distributionGenerator(tree, { name: 'acme-studio', styles: 'precompiled' });
    expect(tree.exists('.postcssrc.json')).toBe(false);
  });

  it('writes nothing beside a script the build ignores, and says which file the build would read', async () => {
    const written = 'module.exports = { plugins: {} };\n';
    tree.write('postcss.config.js', written);
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);

    await distributionGenerator(tree, { name: 'acme-studio' });

    expect(tree.read('postcss.config.js', 'utf8')).toBe(written);
    expect(tree.exists('.postcssrc.json')).toBe(false);
    const [note] = warn.mock.calls.map(([message]) => String(message));
    expect(note).toContain(
      'postcss.config.js is a script, which the Angular build does not read',
    );
    expect(note).toContain(
      '.postcssrc.json containing { "plugins": { "@tailwindcss/postcss": {} } }',
    );
    expect(note).toContain('shadows postcss.config.js');
    expect(note).toContain('renders unstyled');
    warn.mockRestore();
  });

  it('writes nothing into a configuration that stands beside a script either, and names it', async () => {
    tree.write('postcss.config.js', 'module.exports = {};\n');
    tree.write('postcss.config.json', '{}');
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);

    await distributionGenerator(tree, { name: 'acme-studio' });

    expect(JSON.parse(tree.read('postcss.config.json', 'utf8') as string)).toEqual({});
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining(
        'postcss.config.json has to name @tailwindcss/postcss under "plugins"',
      ),
    );
    warn.mockRestore();
  });

  it('says nothing about a script where the build already runs the plugin', async () => {
    tree.write('postcss.config.js', 'module.exports = {};\n');
    tree.write(
      '.postcssrc.json',
      JSON.stringify({ plugins: { '@tailwindcss/postcss': {} } }),
    );
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);

    await distributionGenerator(tree, { name: 'acme-studio' });

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('adds the plugin to the configuration the build reads first', async () => {
    tree.write(
      'postcss.config.json',
      JSON.stringify({ plugins: { autoprefixer: {} } }),
    );

    await distributionGenerator(tree, { name: 'acme-studio' });

    expect(
      JSON.parse(tree.read('postcss.config.json', 'utf8') as string),
    ).toEqual({ plugins: { autoprefixer: {}, '@tailwindcss/postcss': {} } });
    expect(tree.exists('.postcssrc.json')).toBe(false);
  });

  it('adds the plugin to the configuration in the project root, where the build looks first', async () => {
    addProjectConfiguration(tree, 'acme-studio', {
      root: 'apps/acme-studio',
      projectType: 'application',
      targets: {
        build: { executor: '@angular/build:application', options: {} },
      },
    });
    tree.write(
      'apps/acme-studio/.postcssrc.json',
      JSON.stringify({ plugins: { autoprefixer: {} } }),
    );
    tree.write('postcss.config.json', '{}');

    await distributionGenerator(tree, { name: 'acme-studio', force: true });

    expect(
      JSON.parse(tree.read('apps/acme-studio/.postcssrc.json', 'utf8') as string),
    ).toEqual({ plugins: { autoprefixer: {}, '@tailwindcss/postcss': {} } });
    expect(JSON.parse(tree.read('postcss.config.json', 'utf8') as string)).toEqual({});
    expect(tree.exists('.postcssrc.json')).toBe(false);
  });

  it('writes nothing beside a script in the project root either', async () => {
    tree.write('apps/acme-studio/postcss.config.mjs', 'export default {};\n');
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);

    await distributionGenerator(tree, { name: 'acme-studio' });

    expect(tree.exists('.postcssrc.json')).toBe(false);
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(
        /apps\/acme-studio\/postcss\.config\.mjs is a script, which the Angular build does not read/,
      ),
    );
    warn.mockRestore();
  });

  it('gives a directory written as ./apps/x the paths of apps/x', async () => {
    await distributionGenerator(tree, {
      name: 'acme-studio',
      directory: './apps/acme-studio/',
    });

    const project = readJson(tree, 'apps/acme-studio/project.json');
    expect(project.sourceRoot).toBe('apps/acme-studio/src');
    expect(project.targets.build.options.browser).toBe(
      'apps/acme-studio/src/main.ts',
    );
    expect(readJson(tree, 'apps/acme-studio/tsconfig.json').extends).toBe(
      '../../tsconfig.base.json',
    );
    expect(tree.read('apps/acme-studio/src/styles.css', 'utf8')).toContain(
      "@source '../../../node_modules/@loomweaver/shell'",
    );
  });

  it('names a style pipeline file it cannot read as JSON, and writes nothing', async () => {
    tree.write('.postcssrc.json', '{ "plugins": ');

    await expect(
      distributionGenerator(tree, { name: 'acme-studio' }),
    ).rejects.toThrow(/^\.postcssrc\.json is not valid JSON/);
  });

  it('keeps the plugins a workspace already configured', async () => {
    tree.write('.postcssrc.json', JSON.stringify({ plugins: { autoprefixer: {} } }));
    await distributionGenerator(tree, { name: 'acme-studio' });
    expect(
      Object.keys(JSON.parse(tree.read('.postcssrc.json', 'utf8') as string).plugins).toSorted((a, b) => a.localeCompare(b)),
    ).toEqual(['@tailwindcss/postcss', 'autoprefixer']);
  });
});

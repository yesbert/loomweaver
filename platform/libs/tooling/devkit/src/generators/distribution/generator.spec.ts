import { addProjectConfiguration, Tree, readJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { distributionGenerator } from './generator';

describe('distribution generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
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
    const styles = tree.read('apps/acme-studio/src/styles.css', 'utf-8') ?? '';
    expect(styles).toContain("@import '@loomweaver/shell/styles/shell.css'");
    expect(styles).not.toContain('tailwindcss');
  });

  it('gives the test target something to run', async () => {
    await distributionGenerator(tree, { name: 'acme-studio' });
    expect(tree.exists('apps/acme-studio/src/app/app.config.spec.ts')).toBe(
      true,
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
    expect(
      readJson(tree, 'apps/acme-studio/project.json').targets.test,
    ).toBeUndefined();
  });

  it("keeps Angular's app-root lintable beside the project prefix", async () => {
    await distributionGenerator(tree, { name: 'acme-studio' });
    const eslint = tree.read('apps/acme-studio/eslint.config.mjs', 'utf-8');
    expect(eslint).toContain("prefix: ['lw', 'app']");
    expect(tree.read('apps/acme-studio/src/app/app.ts', 'utf-8')).toContain(
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

  it('writes the style pipeline the generated stylesheet needs', async () => {
    await distributionGenerator(tree, { name: 'acme-studio' });
    expect(JSON.parse(tree.read('.postcssrc.json', 'utf-8') as string)).toEqual({
      plugins: { '@tailwindcss/postcss': {} },
    });
  });

  it('leaves the style pipeline alone for a stylesheet that needs none', async () => {
    await distributionGenerator(tree, { name: 'acme-studio', styles: 'precompiled' });
    expect(tree.exists('.postcssrc.json')).toBe(false);
  });

  it('keeps the plugins a workspace already configured', async () => {
    tree.write('.postcssrc.json', JSON.stringify({ plugins: { autoprefixer: {} } }));
    await distributionGenerator(tree, { name: 'acme-studio' });
    expect(
      Object.keys(JSON.parse(tree.read('.postcssrc.json', 'utf-8') as string).plugins).toSorted(),
    ).toEqual(['@tailwindcss/postcss', 'autoprefixer']);
  });
});

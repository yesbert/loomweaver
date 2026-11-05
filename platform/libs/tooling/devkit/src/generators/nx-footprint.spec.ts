import { addProjectConfiguration, formatFiles, Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { distributionGenerator } from './distribution/generator';
import { nxDistributionFootprint, nxWeaverFootprint } from './nx-footprint';
import { weaverGenerator } from './weaver/generator';

const APP = { name: 'studio', root: 'apps/studio' };

function contents(tree: Tree): Map<string, string> {
  const found = new Map<string, string>();
  const walk = (folder: string): void => {
    for (const child of tree.children(folder)) {
      const path = folder === '.' ? child : `${folder}/${child}`;
      if (tree.isFile(path)) {
        found.set(path, tree.read(path, 'utf8') ?? '');
      } else {
        walk(path);
      }
    }
  };
  walk('.');
  return found;
}

function touchedSince(before: Map<string, string>, tree: Tree): string[] {
  return [...contents(tree)]
    .filter(([path, content]) => before.get(path) !== content)
    .map(([path]) => path)
    .toSorted((a, b) => a.localeCompare(b));
}

function sorted(paths: readonly string[]): string[] {
  return paths.toSorted((a, b) => a.localeCompare(b));
}

describe('the footprint of the generators in an Nx workspace', () => {
  let tree: Tree;
  const read = (path: string) => tree.read(path, 'utf8') ?? undefined;

  beforeEach(async () => {
    tree = createTreeWithEmptyWorkspace({ formatter: 'prettier' });
    addProjectConfiguration(tree, APP.name, {
      root: APP.root,
      projectType: 'application',
      targets: {
        build: {
          executor: '@angular/build:application',
          options: { styles: [`${APP.root}/src/styles.css`] },
        },
      },
    });
    tree.write(`${APP.root}/tsconfig.json`, '{}\n');
    tree.write(`${APP.root}/src/main.ts`, 'export {};\n');
    tree.write(`${APP.root}/src/styles.css`, '\n');
    await formatFiles(tree);
  });

  it('names exactly the files the distribution generator creates or changes', async () => {
    const values = { title: 'Studio', styles: 'tailwind' as const };
    const footprint = nxDistributionFootprint(APP, values, read);
    const before = contents(tree);

    await distributionGenerator(tree, { ...values, name: APP.name, directory: APP.root, force: true });

    expect(sorted(footprint)).toEqual(touchedSince(before, tree));
    expect(footprint).not.toContain(`${APP.root}/tsconfig.json`);
    expect(footprint).toContain(`${APP.root}/tsconfig.app.json`);
  });

  it('leaves out a style pipeline that already carries the plugin', async () => {
    tree.write('.postcssrc.json', '{ "plugins": { "@tailwindcss/postcss": {} } }\n');

    expect(nxDistributionFootprint(APP, { styles: 'tailwind' }, read)).not.toContain(
      '.postcssrc.json',
    );
  });

  it('names the style pipeline file the build reads first', async () => {
    tree.write('postcss.config.json', '{}\n');
    tree.write('postcss.config.js', 'module.exports = {};\n');
    await formatFiles(tree);
    const footprint = nxDistributionFootprint(APP, { styles: 'tailwind' }, read);
    const before = contents(tree);

    await distributionGenerator(tree, { name: APP.name, directory: APP.root, force: true });

    expect(footprint).toContain('postcss.config.json');
    expect(sorted(footprint)).toEqual(touchedSince(before, tree));
  });

  it('names exactly the files the weaver generator creates or changes', async () => {
    await distributionGenerator(tree, { name: APP.name, directory: APP.root, force: true });
    const values = { id: 'notes', command: true };
    const footprint = nxWeaverFootprint(APP, values, read);
    const before = contents(tree);

    await weaverGenerator(tree, { ...values, app: APP.name });

    expect(sorted(footprint)).toEqual(touchedSince(before, tree));
    expect(footprint).toContain('tsconfig.base.json');
    expect(footprint).toContain(`${APP.root}/src/app/app.config.ts`);
  });

  it('leaves the stylesheet out where the application runs no Tailwind', async () => {
    await distributionGenerator(tree, {
      name: APP.name,
      directory: APP.root,
      styles: 'precompiled',
      force: true,
    });

    expect(nxWeaverFootprint(APP, { id: 'notes' }, read)).not.toContain(
      `${APP.root}/src/styles.css`,
    );
  });
});

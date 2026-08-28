import { addProjectConfiguration, Tree, updateJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

export function createConsumerWorkspace(
  appName = 'studio',
  appRoot = `apps/${appName}`,
): Tree {
  const tree = createTreeWithEmptyWorkspace();
  updateJson(tree, 'package.json', (json) => ({
    ...json,
    name: '@acme/source',
  }));
  addProjectConfiguration(tree, appName, {
    root: appRoot,
    projectType: 'application',
    targets: {
      build: {
        options: {
          assets: [`${appRoot}/public`],
          styles: [`${appRoot}/src/styles.css`],
        },
      },
    },
  });
  tree.write(`${appRoot}/src/styles.css`, TAILWIND_STYLESHEET);
  return tree;
}

const TAILWIND_STYLESHEET = `@import 'tailwindcss';
@import '@loomweaver/shell/styles/theme.css';

@plugin '@tailwindcss/typography';

@source '../../../node_modules/@loomweaver/shell';
@source './';
`;

export const PRECOMPILED_STYLESHEET = `@import '@loomweaver/shell/styles/shell.css';\n`;

export function addApp(
  tree: Tree,
  name: string,
  options: { buildable?: boolean } = {},
): void {
  addProjectConfiguration(tree, name, {
    root: `apps/${name}`,
    projectType: 'application',
    targets:
      options.buildable === false
        ? { e2e: {} }
        : { build: { options: { assets: [`apps/${name}/public`] } } },
  });
}

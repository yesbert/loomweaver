import { Tree } from '@nx/devkit';
import { addApp, createConsumerWorkspace } from '../test-workspace';
import { authSourceGenerator } from './generator';

describe('auth-source generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createConsumerWorkspace();
  });

  it('writes into the resolved application', async () => {
    await authSourceGenerator(tree, { name: 'dev' });
    expect(tree.exists('apps/studio/src/auth/dev-auth-source.ts')).toBe(true);
  });

  it("follows the application's own root rather than assuming apps/", async () => {
    const nested = createConsumerWorkspace('studio', 'packages/apps/studio');
    await authSourceGenerator(nested, { name: 'dev' });
    expect(
      nested.exists('packages/apps/studio/src/auth/dev-auth-source.ts'),
    ).toBe(true);
  });

  it('writes the verbs, the index and the bundles, and composes them into the app', async () => {
    tree.write(
      'apps/studio/src/app/app.config.ts',
      `import { ApplicationConfig } from '@angular/core';
import { provideShell, provideShellRouter } from '@loomweaver/shell';

export const appConfig: ApplicationConfig = {
  providers: [
    provideShellRouter(),
    provideShell(),
  ],
};
`,
    );
    await authSourceGenerator(tree, { name: 'dev' });
    for (const file of ['dev-session.plugin.ts', 'index.ts', 'i18n/en.json', 'i18n/de.json']) {
      expect(tree.exists(`apps/studio/src/auth/${file}`)).toBe(true);
    }
    const config = tree.read('apps/studio/src/app/app.config.ts', 'utf8') ?? '';
    expect(config).toContain("import { devAuthSource, devSessionPlugin } from '../auth';");
    expect(config).toContain('provideAuthSource(() => devAuthSource()),');
    expect(config).toContain('...providePlugins(devSessionPlugin),');
  });

  it('writes the source alone under bare, and composes nothing', async () => {
    tree.write('apps/studio/src/app/app.config.ts', 'export const appConfig = { providers: [] };\n');
    await authSourceGenerator(tree, { name: 'dev', bare: true });
    expect(tree.exists('apps/studio/src/auth/dev-auth-source.ts')).toBe(true);
    expect(tree.exists('apps/studio/src/auth/dev-session.plugin.ts')).toBe(false);
    expect(tree.read('apps/studio/src/app/app.config.ts', 'utf8')).toBe('export const appConfig = { providers: [] };\n');
  });

  it('refuses to overwrite', async () => {
    await authSourceGenerator(tree, { name: 'dev' });
    await expect(authSourceGenerator(tree, { name: 'dev' })).rejects.toThrow(
      /already exists/,
    );
  });

  it('names the candidates when the workspace has several applications', async () => {
    const many = createConsumerWorkspace('one', 'apps/one');
    addApp(many, 'two');
    await expect(authSourceGenerator(many, { name: 'dev' })).rejects.toThrow(
      /one, two/,
    );
  });
});

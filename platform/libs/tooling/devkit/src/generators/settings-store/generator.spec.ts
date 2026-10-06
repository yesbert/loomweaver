import { logger, Tree } from '@nx/devkit';
import {
  createConsumerWorkspace,
  createGeneratedDistribution,
  GENERATED_APP,
} from '../test-workspace';
import { settingsStoreGenerator } from './generator';

describe('settings-store generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createConsumerWorkspace();
  });

  it('writes into the resolved application', async () => {
    await settingsStoreGenerator(tree, { name: 'backend' });
    expect(
      tree.exists('apps/studio/src/settings/backend-settings-store.ts'),
    ).toBe(true);
  });
});

describe('settings-store generator in a generated distribution', () => {
  it('provides the store in the composition root, after the shell', async () => {
    const tree = await createGeneratedDistribution();

    await settingsStoreGenerator(tree, { name: 'backend', app: 'acme-studio' });

    const config = tree.read(`${GENERATED_APP}/src/app/app.config.ts`, 'utf8') ?? '';
    expect(config).toContain(
      "import { BackendSettingsStore } from '../settings/backend-settings-store';",
    );
    expect(config).toContain('provideSettingsStore(new BackendSettingsStore()),');
    expect(config.indexOf('provideSettingsStore(new')).toBeGreaterThan(
      config.indexOf('provideShell('),
    );
  });

  it('keeps a store the product already provides and names the swap', async () => {
    const tree = await createGeneratedDistribution();
    await settingsStoreGenerator(tree, { name: 'backend', app: 'acme-studio' });
    const before = tree.read(`${GENERATED_APP}/src/app/app.config.ts`, 'utf8');
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);

    await settingsStoreGenerator(tree, { name: 'other', app: 'acme-studio' });

    expect(tree.read(`${GENERATED_APP}/src/app/app.config.ts`, 'utf8')).toBe(before);
    expect(warn).toHaveBeenCalledWith(
      'kept the provideSettingsStore already there instead of provideSettingsStore(new OtherSettingsStore())',
    );
    warn.mockRestore();
  });
});

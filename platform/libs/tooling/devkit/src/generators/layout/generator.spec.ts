import { logger, Tree } from '@nx/devkit';
import {
  createConsumerWorkspace,
  createGeneratedDistribution,
  GENERATED_APP,
} from '../test-workspace';
import { layoutGenerator } from './generator';

describe('layout generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createConsumerWorkspace();
  });

  it('writes into the resolved application', async () => {
    await layoutGenerator(tree, {});
    expect(tree.exists('apps/studio/src/base-layout.ts')).toBe(true);
  });
});

describe('layout generator', () => {
  it('provides the layout where the composition root provides none', async () => {
    const tree = createConsumerWorkspace();
    tree.write(
      'apps/studio/src/app/app.config.ts',
      `import { ApplicationConfig } from '@angular/core';
import { provideShell } from '@loomweaver/shell';

export const appConfig: ApplicationConfig = {
  providers: [
    provideShell(),
  ],
};
`,
    );

    await layoutGenerator(tree, { name: 'wide' });

    const config = tree.read('apps/studio/src/app/app.config.ts', 'utf8') ?? '';
    expect(config).toContain("import { wideLayout } from '../wide-layout';");
    expect(config).toMatch(/provideShell\(\),\s*provideLayout\(wideLayout\)/);
  });

  it("keeps a generated distribution's own layout and names the swap", async () => {
    const tree = await createGeneratedDistribution();
    const before = tree.read(`${GENERATED_APP}/src/app/app.config.ts`, 'utf8');
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);

    await layoutGenerator(tree, { name: 'wide', app: 'acme-studio' });

    expect(tree.exists(`${GENERATED_APP}/src/wide-layout.ts`)).toBe(true);
    expect(tree.read(`${GENERATED_APP}/src/app/app.config.ts`, 'utf8')).toBe(before);
    expect(warn).toHaveBeenCalledWith(
      'kept the provideLayout already there instead of provideLayout(wideLayout)',
    );
    warn.mockRestore();
  });
});

import {
  addProjectConfiguration,
  readProjectConfiguration,
  Tree,
  readJson,
  updateProjectConfiguration,
} from '@nx/devkit';
import {
  createConsumerWorkspace,
  PRECOMPILED_STYLESHEET,
} from '../test-workspace';
import { weaverGenerator } from './generator';

describe('weaver generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createConsumerWorkspace();
  });

  it('scaffolds a weaver library into the consumer default location', async () => {
    await weaverGenerator(tree, { id: 'notes', name: 'Notes' });
    const root = 'libs/notes-weaver';

    expect(tree.exists(`${root}/project.json`)).toBe(true);
    expect(tree.exists(`${root}/tsconfig.json`)).toBe(true);
    expect(tree.exists(`${root}/tsconfig.spec.json`)).toBe(true);
    expect(tree.exists(`${root}/eslint.config.mjs`)).toBe(true);
    expect(tree.exists(`${root}/src/index.ts`)).toBe(true);
    expect(tree.exists(`${root}/src/lib/plugin/notes.plugin.ts`)).toBe(true);

    const project = readJson(tree, `${root}/project.json`);
    expect(project.name).toBe('notes-weaver');
    expect(project.tags).toEqual([]);
  });

  it('emits no project-level test setup — a weaver joins an existing project', async () => {
    await weaverGenerator(tree, { id: 'notes' });
    expect(tree.exists('libs/notes-weaver/src/test-setup.ts')).toBe(false);
  });

  it('tests through the build options of the app that composes it', async () => {
    await weaverGenerator(tree, { id: 'notes' });
    const project = readJson(tree, 'libs/notes-weaver/project.json');
    expect(project.targets.test.executor).toBe('@nx/angular:unit-test');
    expect(project.targets.test.options.buildTarget).toBe(
      'studio:build:development',
    );
  });

  it('omits the test wiring for a workspace that runs something else', async () => {
    await weaverGenerator(tree, { id: 'notes', unitTestRunner: 'none' });
    const project = readJson(tree, 'libs/notes-weaver/project.json');
    expect(project.targets.test).toBeUndefined();
    expect(tree.exists('libs/notes-weaver/tsconfig.spec.json')).toBe(false);
  });

  it('takes the import alias from the workspace scope', async () => {
    await weaverGenerator(tree, { id: 'notes' });
    const base = readJson(tree, 'tsconfig.base.json');
    expect(base.compilerOptions.paths['@acme/notes-weaver']).toEqual([
      './libs/notes-weaver/src/index.ts',
    ]);
  });

  it('honours an explicit directory, project name, import path, tags and prefix', async () => {
    await weaverGenerator(tree, {
      id: 'notes',
      directory: 'packages/plugins/notes',
      projectName: 'notes',
      importPath: '@acme/notes',
      tags: 'scope:plugin, type:feature',
      prefix: 'ac',
    });

    const project = readJson(tree, 'packages/plugins/notes/project.json');
    expect(project.name).toBe('notes');
    expect(project.prefix).toBe('ac');
    expect(project.tags).toEqual(['scope:plugin', 'type:feature']);

    const base = readJson(tree, 'tsconfig.base.json');
    expect(base.compilerOptions.paths['@acme/notes']).toEqual([
      './packages/plugins/notes/src/index.ts',
    ]);
  });

  it('walks back to the workspace root from any depth', async () => {
    await weaverGenerator(tree, {
      id: 'notes',
      directory: 'packages/plugins/notes',
    });
    const tsconfig = readJson(tree, 'packages/plugins/notes/tsconfig.json');
    expect(tsconfig.extends).toBe('../../../tsconfig.base.json');
  });

  it('names the project that already occupies the directory', async () => {
    await weaverGenerator(tree, { id: 'notes' });
    await expect(weaverGenerator(tree, { id: 'notes' })).rejects.toThrow(
      /libs\/notes-weaver/,
    );
  });

  it('carries the prefix into the generated component selectors', async () => {
    await weaverGenerator(tree, { id: 'notes', prefix: 'ac', about: true });
    expect(
      tree.read('libs/notes-weaver/src/lib/views/notes-view.ts', 'utf8'),
    ).toContain("selector: 'ac-notes-view'");
    expect(
      tree.read(
        'libs/notes-weaver/src/lib/dialogs/notes-about-dialog.ts',
        'utf8',
      ),
    ).toContain("selector: 'ac-notes-about-dialog'");
  });

  it('honours --container', async () => {
    await weaverGenerator(tree, { id: 'notes', container: true });
    expect(
      tree.read('libs/notes-weaver/src/lib/plugin/notes.plugin.ts', 'utf8'),
    ).toContain("routable: { path: 'notes/:id' }");
    expect(
      tree.exists('libs/notes-weaver/src/lib/views/notes-canvas-view.ts'),
    ).toBe(true);
  });

  it('honours --instanceable', async () => {
    await weaverGenerator(tree, { id: 'notes', instanceable: true });
    const plugin = tree.read(
      'libs/notes-weaver/src/lib/plugin/notes.plugin.ts',
      'utf8',
    );
    expect(plugin).toContain("docks: ['primary']");
    expect(plugin).toContain('instanceable: true');
  });

  it('writes the README wiring step against the registered import path', async () => {
    await weaverGenerator(tree, { id: 'notes' });
    expect(tree.read('libs/notes-weaver/README.md', 'utf8')).toContain(
      "from '@acme/notes-weaver'",
    );
  });

  it('serves the i18n bundle through the composing app assets', async () => {
    await weaverGenerator(tree, { id: 'notes' });
    const app = readProjectConfiguration(tree, 'studio');
    expect(app.targets?.['build']?.options?.assets).toContainEqual({
      glob: '**/*.json',
      input: 'libs/notes-weaver/src/lib/i18n',
      output: 'i18n/notes',
    });
  });

  it('scans the weaver templates by pointing the app stylesheet at the library', async () => {
    await weaverGenerator(tree, { id: 'notes' });
    expect(tree.read('apps/studio/src/styles.css', 'utf8')).toContain(
      "@source '../../../libs/notes-weaver/src';",
    );
  });

  it('walks back to the stylesheet from a library at any depth', async () => {
    await weaverGenerator(tree, {
      id: 'notes',
      directory: 'packages/weavers/notes',
    });
    expect(tree.read('apps/studio/src/styles.css', 'utf8')).toContain(
      "@source '../../../packages/weavers/notes/src';",
    );
  });

  it('adds no source twice when a weaver is regenerated', async () => {
    await weaverGenerator(tree, { id: 'notes' });
    tree.delete('libs/notes-weaver/project.json');
    await weaverGenerator(tree, { id: 'notes' });
    const css = tree.read('apps/studio/src/styles.css', 'utf8') ?? '';
    expect(css.match(/libs\/notes-weaver\/src/g)).toHaveLength(1);
  });

  it('leaves a precompiled stylesheet alone — that path runs no Tailwind', async () => {
    tree.write('apps/studio/src/styles.css', PRECOMPILED_STYLESHEET);
    await weaverGenerator(tree, { id: 'notes' });
    expect(tree.read('apps/studio/src/styles.css', 'utf8')).toBe(
      PRECOMPILED_STYLESHEET,
    );
  });

  it('leaves a styleless build target alone instead of crashing', async () => {
    const app = readProjectConfiguration(tree, 'studio');
    delete app.targets?.['build']?.options?.styles;
    updateProjectConfiguration(tree, 'studio', app);
    await expect(weaverGenerator(tree, { id: 'notes' })).resolves.not.toThrow();
  });

  it('leaves an assets-less build target alone instead of crashing', async () => {
    const app = readProjectConfiguration(tree, 'studio');
    delete app.targets?.['build']?.options;
    addProjectConfiguration(tree, 'bare', {
      root: 'apps/bare',
      projectType: 'application',
      targets: { build: {} },
    });
    await weaverGenerator(tree, { id: 'notes', app: 'bare' });
    expect(
      readProjectConfiguration(tree, 'bare').targets?.['build']?.options,
    ).toBeUndefined();
  });

  it('rejects an explicit --app that names a library', async () => {
    addProjectConfiguration(tree, 'some-lib', {
      root: 'libs/some-lib',
      projectType: 'library',
      targets: {},
    });
    await expect(
      weaverGenerator(tree, { id: 'notes', app: 'some-lib' }),
    ).rejects.toThrow(/not an application/);
  });
});

describe('weaver generator with an agent connection', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createConsumerWorkspace();
  });

  it('records the packages the generated files import', async () => {
    await weaverGenerator(tree, { id: 'notes', agent: true });
    const manifest = readJson(tree, 'package.json');
    expect(manifest.dependencies['@loomweaver/ag-ui']).toBeTruthy();
    expect(manifest.dependencies['@ag-ui/core']).toBeTruthy();
  });

  it('leaves a version the consumer already chose in place', async () => {
    const manifest = readJson(tree, 'package.json');
    manifest.dependencies = {
      ...manifest.dependencies,
      '@ag-ui/core': '0.0.42',
    };
    tree.write('package.json', JSON.stringify(manifest, null, 2));

    await weaverGenerator(tree, { id: 'notes', agent: true });
    expect(readJson(tree, 'package.json').dependencies['@ag-ui/core']).toBe(
      '0.0.42',
    );
  });

  it('records nothing where no connection was asked for', async () => {
    await weaverGenerator(tree, { id: 'notes' });
    expect(
      readJson(tree, 'package.json').dependencies?.['@loomweaver/ag-ui'],
    ).toBeUndefined();
  });

  it('writes the connection, its panel, its stand-in and its test', async () => {
    await weaverGenerator(tree, { id: 'notes', agent: true });
    const root = 'libs/notes-weaver/src/lib/agent';
    for (const file of [
      'notes-agent.ts',
      'notes-agent.spec.ts',
      'notes-agent-panel.ts',
      'notes-agent-panel.html',
      'notes-agent-source.ts',
    ]) {
      expect(tree.exists(`${root}/${file}`)).toBe(true);
    }
  });
});

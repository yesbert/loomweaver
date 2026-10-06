import { Amendment } from '@loomweaver/devkit';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { applyAmend, planAmend } from './amend';

const POSTCSS: Amendment = {
  kind: 'postcss',
  file: '.postcssrc.json',
  plugin: '@tailwindcss/postcss',
};

const BUILD: Amendment = {
  kind: 'build-target',
  styles: ['src/styles.css'],
  assets: [
    {
      glob: '**/*',
      input: 'node_modules/@loomweaver/shell/i18n',
      from: 'workspace',
      output: 'i18n',
    },
  ],
  serviceWorker: 'ngsw-config.json',
  inlineCritical: false,
};

describe('planAmend', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'loom-amend-'));
    writeFileSync(join(dir, 'package.json'), '{}');
    writeFileSync(
      join(dir, 'angular.json'),
      JSON.stringify({
        version: 1,
        projects: {
          studio: {
            projectType: 'application',
            root: '',
            architect: { build: { options: { browser: 'src/main.ts' } } },
          },
        },
      }),
    );
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  function angular() {
    return JSON.parse(readFileSync(join(dir, 'angular.json'), 'utf8'));
  }

  it('creates the style pipeline configuration the stylesheet needs', () => {
    const plan = planAmend([POSTCSS], dir);
    applyAmend(plan);
    expect(
      JSON.parse(readFileSync(join(dir, '.postcssrc.json'), 'utf8')),
    ).toEqual({
      plugins: { '@tailwindcss/postcss': {} },
    });
  });

  it('wires the build target of the only application', () => {
    applyAmend(planAmend([BUILD], dir));
    const build = angular().projects.studio.architect.build;
    expect(build.options.styles).toEqual(['src/styles.css']);
    expect(build.options.assets).toContainEqual({
      glob: '**/*',
      input: 'node_modules/@loomweaver/shell/i18n',
      output: 'i18n',
    });
    expect(build.configurations.production.serviceWorker).toBe(
      'ngsw-config.json',
    );
    expect(build.configurations.production.optimization).toEqual({
      styles: { inlineCritical: false },
    });
  });

  it('gathers several amendments to one file into a single rewrite', () => {
    const plan = planAmend(
      [BUILD, { kind: 'stylesheet-source', sourceRoot: 'src/notes/src' }],
      dir,
    );
    const angularWrites = plan.amendments.filter((a) =>
      a.file.endsWith('angular.json'),
    );
    expect(angularWrites).toHaveLength(1);
  });

  it('names every file it would touch and changes nothing until applied', () => {
    const before = readFileSync(join(dir, 'angular.json'), 'utf8');
    const plan = planAmend([POSTCSS, BUILD], dir);
    expect(
      plan.amendments
        .map((a) => a.display)
        .toSorted((a, b) => a.localeCompare(b)),
    ).toEqual(['.postcssrc.json', 'angular.json']);
    expect(readFileSync(join(dir, 'angular.json'), 'utf8')).toBe(before);
  });

  it('changes nothing on a second run', () => {
    applyAmend(planAmend([POSTCSS, BUILD], dir));
    const after = readFileSync(join(dir, 'angular.json'), 'utf8');
    const second = planAmend([POSTCSS, BUILD], dir);
    expect(second.amendments).toHaveLength(0);
    expect(readFileSync(join(dir, 'angular.json'), 'utf8')).toBe(after);
  });

  it('leaves a code-written style configuration alone and says what it costs', () => {
    writeFileSync(join(dir, 'postcss.config.js'), 'module.exports = {};');
    const plan = planAmend([POSTCSS], dir);
    expect(plan.amendments).toHaveLength(0);
    expect(plan.remaining.join(' ')).toContain('renders unstyled');
  });

  it('names the candidates rather than wiring the wrong project', () => {
    writeFileSync(
      join(dir, 'angular.json'),
      JSON.stringify({
        projects: {
          one: { root: 'apps/one', architect: { build: {} } },
          two: { root: 'apps/two', architect: { build: {} } },
        },
      }),
    );
    const plan = planAmend([BUILD], dir);
    expect(plan.amendments).toHaveLength(0);
    expect(plan.remaining.join(' ')).toContain('one, two');
  });

  it('names an unresolvable project once, however many amendments need it', () => {
    writeFileSync(
      join(dir, 'angular.json'),
      JSON.stringify({
        projects: {
          one: { root: 'apps/one', architect: { build: {} } },
          two: { root: 'apps/two', architect: { build: {} } },
        },
      }),
    );
    const plan = planAmend(
      [BUILD, { kind: 'stylesheet-source', sourceRoot: 'src/notes/src' }],
      dir,
    );
    expect(plan.remaining).toHaveLength(1);
  });

  it('finds an entry stylesheet the build names in object form', () => {
    writeFileSync(
      join(dir, 'angular.json'),
      JSON.stringify({
        projects: {
          studio: {
            root: '',
            architect: {
              build: {
                options: {
                  styles: [{ input: 'src/styles.css', bundleName: 'main' }],
                },
              },
            },
          },
        },
      }),
    );
    mkdirSync(join(dir, 'src'), { recursive: true });
    writeFileSync(join(dir, 'src', 'styles.css'), "@import 'tailwindcss';\n");
    applyAmend(
      planAmend([{ kind: 'stylesheet-source', sourceRoot: 'src/notes/src' }], dir),
    );
    expect(readFileSync(join(dir, 'src', 'styles.css'), 'utf8')).toContain(
      "@source 'notes/src';",
    );
  });

  it('takes a source line as a sign the stylesheet runs Tailwind', () => {
    writeFileSync(
      join(dir, 'angular.json'),
      JSON.stringify({
        projects: {
          studio: {
            root: '',
            architect: { build: { options: { styles: ['src/styles.css'] } } },
          },
        },
      }),
    );
    mkdirSync(join(dir, 'src'), { recursive: true });
    writeFileSync(
      join(dir, 'src', 'styles.css'),
      "@import 'tailwindcss/utilities.css';\n@source './';\n",
    );
    applyAmend(
      planAmend([{ kind: 'stylesheet-source', sourceRoot: 'src/notes/src' }], dir),
    );
    expect(readFileSync(join(dir, 'src', 'styles.css'), 'utf8')).toContain(
      "@source 'notes/src';",
    );
  });

  it('wires the project the target sits inside', () => {
    mkdirSync(join(dir, 'apps', 'two'), { recursive: true });
    writeFileSync(
      join(dir, 'angular.json'),
      JSON.stringify({
        projects: {
          one: { root: 'apps/one', architect: { build: {} } },
          two: { root: 'apps/two', architect: { build: {} } },
        },
      }),
    );
    applyAmend(planAmend([BUILD], join(dir, 'apps', 'two')));
    expect(angular().projects.two.architect.build.options.styles).toEqual([
      'apps/two/src/styles.css',
    ]);
    expect(angular().projects.one.architect.build.options).toBeUndefined();
  });

  it('says what it could not wire where no workspace is found', () => {
    const orphan = mkdtempSync(join(tmpdir(), 'loom-orphan-'));
    const plan = planAmend([POSTCSS, BUILD], join(orphan, 'nested'));
    expect(plan.amendments).toHaveLength(0);
    expect(plan.remaining.join(' ')).toContain('.postcssrc.json');
    rmSync(orphan, { recursive: true, force: true });
  });
});

describe('planAmend for what a generated theme, layout, store or frame plugin needs', () => {
  let dir: string;
  const CONFIG = `import { ApplicationConfig } from '@angular/core';
import { provideShell, provideLayout } from '@loomweaver/shell';
import { layout } from './layout';

export const appConfig: ApplicationConfig = {
  providers: [
    provideShell(),
    provideLayout(layout),
  ],
};
`;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'loom-amend-'));
    writeFileSync(join(dir, 'package.json'), '{}');
    writeFileSync(
      join(dir, 'angular.json'),
      JSON.stringify({
        version: 1,
        projects: {
          studio: {
            projectType: 'application',
            root: '',
            architect: {
              build: { options: { browser: 'src/main.ts', styles: ['src/styles.css'] } },
            },
          },
        },
      }),
    );
    mkdirSync(join(dir, 'src/app'), { recursive: true });
    writeFileSync(
      join(dir, 'src/styles.css'),
      "@import 'tailwindcss';\n@import '@loomweaver/shell/styles/theme.css';\n",
    );
    writeFileSync(join(dir, 'src/app/app.config.ts'), CONFIG);
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  function read(path: string): string {
    return readFileSync(join(dir, path), 'utf8');
  }

  it('imports a theme after the shell styles', () => {
    applyAmend(
      planAmend(
        [{ kind: 'stylesheet-import', file: 'src/themes/ocean.css', after: '@loomweaver/shell/styles/', without: 'w' }],
        join(dir, 'src/themes'),
      ),
    );

    expect(read('src/styles.css')).toBe(
      "@import 'tailwindcss';\n@import '@loomweaver/shell/styles/theme.css';\n@import './themes/ocean.css';\n",
    );
  });

  it('provides a settings store, and keeps a layout already provided and says so', () => {
    const plan = planAmend(
      [
        {
          kind: 'compose-provider',
          module: 'src/settings/api-settings-store',
          providers: [
            {
              line: 'provideSettingsStore(new ApiSettingsStore()),',
              shell: ['provideSettingsStore'],
              own: ['ApiSettingsStore'],
              unless: 'provideSettingsStore(',
            },
          ],
          without: 'w',
        },
      ],
      join(dir, 'src/settings'),
    );
    applyAmend(plan);
    expect(read('src/app/app.config.ts')).toContain(
      "import { ApiSettingsStore } from '../settings/api-settings-store';",
    );
    expect(read('src/app/app.config.ts')).toContain(
      '    provideLayout(layout),\n    provideSettingsStore(new ApiSettingsStore()),\n',
    );

    const layout = planAmend(
      [
        {
          kind: 'compose-provider',
          module: 'src/wide-layout',
          providers: [
            { line: 'provideLayout(wideLayout),', shell: ['provideLayout'], own: ['wideLayout'], unless: 'provideLayout(' },
          ],
          without: 'w',
        },
      ],
      join(dir, 'src'),
    );
    expect(layout.amendments).toEqual([]);
    expect(layout.remaining.join(' ')).toContain(
      'kept the provideLayout already there instead of provideLayout(wideLayout)',
    );
  });
});

describe('planAmend for a package the generated output needs', () => {
  const AG_UI: Amendment = {
    kind: 'package',
    name: '@loomweaver/ag-ui',
    version: '^0.7.6',
  };
  const CORE: Amendment = {
    kind: 'package',
    name: '@ag-ui/core',
    version: '0.0.x',
  };

  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'loom-amend-pkg-'));
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({ name: 'studio' }, null, 2),
    );
    writeFileSync(
      join(dir, 'angular.json'),
      JSON.stringify({ version: 1, projects: {} }),
    );
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  function manifest() {
    return JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  }

  it('records both packages in one write', () => {
    const plan = planAmend([AG_UI, CORE], dir);
    expect(plan.amendments).toHaveLength(1);
    applyAmend(plan);
    expect(manifest().dependencies).toEqual({
      '@ag-ui/core': '0.0.x',
      '@loomweaver/ag-ui': '^0.7.6',
    });
  });

  it('says that recording is not installing', () => {
    expect(planAmend([AG_UI], dir).remaining.join(' ')).toContain(
      'Install what was just recorded',
    );
  });

  it('leaves a version the consumer already chose alone', () => {
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({ dependencies: { '@ag-ui/core': '0.0.42' } }, null, 2),
    );
    const plan = planAmend([CORE], dir);
    expect(plan.amendments).toEqual([]);
    applyAmend(plan);
    expect(manifest().dependencies['@ag-ui/core']).toBe('0.0.42');
  });

  it('records the package in the workspace, not in a package nested inside it', () => {
    const nested = join(dir, 'projects', 'lib');
    mkdirSync(join(nested, 'src', 'notes'), { recursive: true });
    writeFileSync(join(nested, 'package.json'), '{"name":"lib"}');
    applyAmend(planAmend([AG_UI], join(nested, 'src', 'notes')));
    expect(manifest().dependencies).toEqual({ '@loomweaver/ag-ui': '^0.7.6' });
    expect(readFileSync(join(nested, 'package.json'), 'utf8')).toBe(
      '{"name":"lib"}',
    );
  });

  it('writes nothing when only planned', () => {
    planAmend([AG_UI], dir);
    expect(manifest().dependencies).toBeUndefined();
  });
});

import { Amendment } from '@loomweaver/devkit';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
    expect(JSON.parse(readFileSync(join(dir, '.postcssrc.json'), 'utf8'))).toEqual({
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
    expect(build.configurations.production.serviceWorker).toBe('ngsw-config.json');
    expect(build.configurations.production.optimization).toEqual({
      styles: { inlineCritical: false },
    });
  });

  it('gathers several amendments to one file into a single rewrite', () => {
    const plan = planAmend(
      [BUILD, { kind: 'stylesheet-source', sourceRoot: 'src/notes/src' }],
      dir,
    );
    const angularWrites = plan.amendments.filter((a) => a.file.endsWith('angular.json'));
    expect(angularWrites).toHaveLength(1);
  });

  it('names every file it would touch and changes nothing until applied', () => {
    const before = readFileSync(join(dir, 'angular.json'), 'utf8');
    const plan = planAmend([POSTCSS, BUILD], dir);
    expect(plan.amendments.map((a) => a.display).sort()).toEqual([
      '.postcssrc.json',
      'angular.json',
    ]);
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

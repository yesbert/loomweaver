import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { run } from './run';

function capture() {
  const out: string[] = [];
  const err: string[] = [];
  return {
    io: {
      out: (l: string) => void out.push(l),
      err: (l: string) => void err.push(l),
    },
    text: () => out.join('\n'),
    errText: () => err.join('\n'),
  };
}

function write(root: string, files: Record<string, string>): void {
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(join(root, path, '..'), { recursive: true });
    writeFileSync(join(root, path), content, 'utf8');
  }
}

function angularApp(root: string, name = 'my-studio'): void {
  write(root, {
    'package.json': JSON.stringify(
      {
        name,
        scripts: { start: 'ng serve' },
        dependencies: {
          '@angular/core': '^22.1.0',
          '@angular/router': '^22.1.0',
        },
        devDependencies: { '@angular/cli': '^22.1.0' },
      },
      null,
      2,
    ),
    'angular.json': JSON.stringify(
      {
        version: 1,
        projects: {
          [name]: {
            projectType: 'application',
            root: '',
            sourceRoot: 'src',
            architect: {
              build: {
                builder: '@angular/build:application',
                options: {
                  browser: 'src/main.ts',
                  styles: ['src/styles.css'],
                  assets: [],
                },
                configurations: { production: { budgets: [] } },
              },
            },
          },
        },
      },
      null,
      2,
    ),
    'src/main.ts':
      "import { bootstrapApplication } from '@angular/platform-browser';\n",
    'src/index.html':
      '<!doctype html><html><body><app-root></app-root></body></html>\n',
    'src/styles.css': '',
    'src/app/app.ts': 'export class App {}\n',
    'src/app/app.html': '<router-outlet />\n',
    'src/app/app.config.ts': 'export const appConfig = { providers: [] };\n',
    'src/app/app.routes.ts': 'export const routes = [];\n',
  });
}

function nxWorkspace(root: string, apps: readonly string[]): void {
  write(root, {
    'package.json': JSON.stringify({
      name: '@acme/source',
      dependencies: { '@angular/core': '^22.1.0' },
      devDependencies: { nx: '23.0.0' },
    }),
    'nx.json': JSON.stringify({
      $schema: './node_modules/nx/schemas/nx-schema.json',
    }),
  });
  for (const app of apps) {
    write(root, {
      [`apps/${app}/project.json`]: JSON.stringify({
        name: app,
        projectType: 'application',
        sourceRoot: `apps/${app}/src`,
        targets: { build: {} },
      }),
      [`apps/${app}/src/app/app.config.ts`]:
        'export const appConfig = { providers: [] };\n',
    });
  }
}

function fakeDeps(cwd: string) {
  const calls: string[][] = [];
  return {
    calls,
    deps: {
      cwd,
      version: '0.9.2',
      exec: (argv: readonly string[]) => void calls.push([...argv]),
    },
  };
}

describe('init', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'loom-init-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('takes a fresh Angular CLI application to a product in one run', () => {
    angularApp(dir);
    const c = capture();
    const { deps, calls } = fakeDeps(dir);
    expect(run(['init'], c.io, deps)).toBe(0);

    expect(calls[0]).toEqual([
      'npm',
      'install',
      '@loomweaver/shell',
      '@loomweaver/plugin-sdk',
      '@loomweaver/frame-kit',
      '@angular/cdk',
      '@jsverse/transloco',
      '@ng-icons/heroicons',
      '@angular/service-worker@^22.1.0',
    ]);
    expect(calls[1]).toEqual([
      'npm',
      'install',
      '-D',
      'tailwindcss',
      '@tailwindcss/postcss',
      '@tailwindcss/typography',
    ]);
    const config = readFileSync(join(dir, 'src/app/app.config.ts'), 'utf8');
    expect(config).toContain('provideShell(');
    expect(config, c.text()).toContain('...providePlugins(notesPlugin)');
    expect(config).toContain("name: 'My Studio'");
    expect(existsSync(join(dir, 'src/notes/src/index.ts'))).toBe(true);
    expect(existsSync(join(dir, 'LOOMWEAVER.md'))).toBe(true);
    expect(
      readFileSync(
        join(dir, 'src/notes/src/lib/plugin/notes.plugin.ts'),
        'utf8',
      ),
    ).toContain("shortcut: 'mod+shift+n'");
    expect(c.text()).toContain(
      'Angular CLI application, packages with npm (no lockfile found, so npm)',
    );
    expect(c.text().trimEnd().endsWith('Serve it with: npm start')).toBe(true);
  });

  it('changes nothing on a second run and says so', () => {
    angularApp(dir);
    const first = fakeDeps(dir);
    run(['init'], capture().io, first.deps);
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({
        name: 'my-studio',
        dependencies: {
          '@angular/core': '^22.1.0',
          '@angular/service-worker': '22.1.0',
          '@loomweaver/shell': '0.9.2',
          '@loomweaver/plugin-sdk': '0.9.2',
          '@loomweaver/frame-kit': '0.9.2',
          '@angular/cdk': '22.1.0',
          '@jsverse/transloco': '8.0.0',
          '@ng-icons/heroicons': '32.0.0',
        },
        devDependencies: {
          tailwindcss: '4',
          '@tailwindcss/postcss': '4',
          '@tailwindcss/typography': '0.5',
        },
      }),
    );
    const before = readFileSync(join(dir, 'src/app/app.config.ts'), 'utf8');
    const c = capture();
    const second = fakeDeps(dir);
    expect(run(['init'], c.io, second.deps)).toBe(0);
    expect(second.calls).toEqual([]);
    expect(readFileSync(join(dir, 'src/app/app.config.ts'), 'utf8')).toBe(
      before,
    );
    expect(c.text()).toContain('Nothing left to do');
  });

  it('names everything and touches nothing on a trial run', () => {
    angularApp(dir);
    const c = capture();
    const { deps, calls } = fakeDeps(dir);
    expect(run(['init', '--dry-run'], c.io, deps)).toBe(0);
    expect(calls).toEqual([]);
    expect(
      readFileSync(join(dir, 'src/app/app.config.ts'), 'utf8'),
    ).not.toContain('provideShell(');
    expect(existsSync(join(dir, 'src/notes'))).toBe(false);
    expect(c.text()).toContain('Would run: npm install @loomweaver/shell');
    expect(c.text(), c.text()).toContain('Would write');
    expect(c.text()).toContain('once the distribution step has run');
    expect(c.text()).toContain('Then serve it with: npm start');
  });

  it('spells the install and the serve command for the package manager the lockfile names', () => {
    angularApp(dir);
    writeFileSync(join(dir, 'pnpm-lock.yaml'), 'lockfileVersion: 9\n');
    const c = capture();
    const { deps, calls } = fakeDeps(dir);
    run(['init'], c.io, deps);
    expect(calls[0].slice(0, 2)).toEqual(['pnpm', 'add']);
    expect(calls[1].slice(0, 3)).toEqual(['pnpm', 'add', '-D']);
    expect(c.text()).toContain('packages with pnpm (from pnpm-lock.yaml)');
    expect(c.text()).toContain('Serve it with: pnpm start');
  });

  it('takes the override over the lockfile, and spells bun its own way', () => {
    angularApp(dir);
    writeFileSync(join(dir, 'yarn.lock'), '');
    const { deps, calls } = fakeDeps(dir);
    run(['init', '--package-manager', 'bun'], capture().io, deps);
    expect(calls[0].slice(0, 2)).toEqual(['bun', 'add']);
    expect(calls[1].slice(0, 3)).toEqual(['bun', 'add', '-d']);
  });

  it('pins the service worker to the installed Angular version when node_modules has one', () => {
    angularApp(dir);
    write(dir, {
      'node_modules/@angular/core/package.json': JSON.stringify({
        version: '22.1.5',
      }),
    });
    const { deps, calls } = fakeDeps(dir);
    run(['init'], capture().io, deps);
    expect(calls[0]).toContain('@angular/service-worker@22.1.5');
  });

  it('leaves the rail empty when asked for no weaver, and says so', () => {
    angularApp(dir);
    const c = capture();
    run(['init', '--no-weaver'], c.io, fakeDeps(dir).deps);
    expect(existsSync(join(dir, 'src/notes'))).toBe(false);
    expect(c.text()).toContain(
      'the rail stays empty until a plugin is composed in',
    );
  });

  it('takes a title, styles and a weaver id', () => {
    angularApp(dir);
    const { deps, calls } = fakeDeps(dir);
    run(
      [
        'init',
        '--title',
        'Acme Studio',
        '--styles',
        'precompiled',
        '--weaver',
        'invoices',
      ],
      capture().io,
      deps,
    );
    expect(calls).toHaveLength(1);
    expect(readFileSync(join(dir, 'src/app/app.config.ts'), 'utf8')).toContain(
      "name: 'Acme Studio'",
    );
    expect(existsSync(join(dir, 'src/invoices/src/index.ts'))).toBe(true);
  });

  it('refuses outside a workspace and names what it expected', () => {
    const c = capture();
    const { deps, calls } = fakeDeps(dir);
    expect(run(['init'], c.io, deps)).toBe(1);
    expect(calls).toEqual([]);
    expect(c.errText()).toContain('expected an angular.json or an nx.json');
    expect(c.errText()).toContain('ng new');
  });

  it('runs the Nx generators over the one application an Nx workspace has', () => {
    nxWorkspace(dir, ['studio']);
    const c = capture();
    const { deps, calls } = fakeDeps(dir);
    expect(run(['init'], c.io, deps)).toBe(0);
    expect(calls[0][0]).toBe('npm');
    expect(calls[1]).toContain('@loomweaver/devkit@0.9.2');
    expect(calls[2]).toEqual([
      'npx',
      'nx',
      'g',
      '@loomweaver/devkit:distribution',
      '--name',
      'studio',
      '--directory',
      'apps/studio',
      '--title',
      'Studio',
      '--styles',
      'tailwind',
      '--force',
    ]);
    expect(calls[3]).toEqual([
      'npx',
      'nx',
      'g',
      '@loomweaver/devkit:weaver',
      '--id',
      'notes',
      '--command',
      '--app',
      'studio',
    ]);
    expect(c.text()).toContain('Serve it with: npx nx serve studio');
  });

  it('names the candidates and does nothing when an Nx workspace has several applications', () => {
    nxWorkspace(dir, ['studio', 'admin', 'studio-e2e']);
    const c = capture();
    const { deps, calls } = fakeDeps(dir);
    expect(run(['init'], c.io, deps)).toBe(1);
    expect(calls).toEqual([]);
    expect(c.errText()).toContain('admin, studio.');
    expect(c.errText()).toContain('--app');
    expect(run(['init', '--app', 'admin'], capture().io, deps)).toBe(0);
    expect(calls.at(-2)).toContain('admin');
  });
});

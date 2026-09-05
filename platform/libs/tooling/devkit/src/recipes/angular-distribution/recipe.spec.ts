import { generate } from '../../lib/generate/generate';
import { angularDistribution, resolveDistributionInput } from './recipe';

describe('angularDistribution recipe', () => {
  it('rejects an unknown styles option instead of quietly emitting Tailwind', () => {
    expect(() =>
      generate(angularDistribution, {
        name: 'acme-studio',
        styles: 'bootstrap' as never,
      }),
    ).toThrow(/Unknown styles option/);
  });

  it('rejects a non-kebab name', () => {
    expect(() => resolveDistributionInput({ name: 'Acme' })).toThrow(/kebab-case/);
  });

  it('defaults the title from the name', () => {
    expect(resolveDistributionInput({ name: 'acme-studio' }).title).toBe('Acme Studio');
  });

  it('produces the distribution source files', () => {
    const files = generate(angularDistribution, { name: 'acme-studio', title: 'Acme Studio' });
    expect(Object.keys(files).toSorted((a, b) => a.localeCompare(b))).toEqual(
      [
        'LOOMWEAVER.md',
        'ngsw-config.json',
        'public/logo.svg',
        'public/manifest.webmanifest',
        'src/app/app.config.spec.ts',
        'src/app/app.config.ts',
        'src/app/app.html',
        'src/app/app.spec.ts',
        'src/app/app.ts',
        'src/index.html',
        'src/main.ts',
        'src/styles.css',
      ].toSorted((a, b) => a.localeCompare(b)),
    );
  });

  it('references the shell as an installed package, never repo-local paths', () => {
    const files = generate(angularDistribution, { name: 'acme-studio' });
    expect(files['src/styles.css']).toContain(
      "@source '../../../node_modules/@loomweaver/shell'",
    );
    expect(files['src/styles.css']).toContain(
      "@import '@loomweaver/shell/styles/theme.css'",
    );
    expect(files['src/styles.css']).not.toContain('libs/core/shell');
    expect(JSON.parse(files['ngsw-config.json']).index).toBe('/index.html');
  });

  it('ships a placeholder logo that logoUrl actually resolves to', () => {
    const files = generate(angularDistribution, { name: 'acme-studio' });
    const logo = files['public/logo.svg'];
    expect(logo).toMatch(/^<svg[\s\S]*<\/svg>\s*$/);
    expect(logo).toContain('viewBox');
    expect(files['src/app/app.config.ts']).toContain("logoUrl: 'logo.svg'");
  });

  it('names an icon everywhere the browser looks for one, and ships the file', () => {
    const files = generate(angularDistribution, { name: 'acme-studio' });
    const icons = JSON.parse(files['public/manifest.webmanifest']).icons as {
      src: string;
    }[];

    expect(icons.length).toBeGreaterThan(0);
    expect(files['src/index.html']).toContain('rel="icon"');
    for (const icon of icons) {
      expect(files[`public/${icon.src}`]).toBeDefined();
    }
  });

  it('caches the translations the chrome cannot render without', () => {
    const groups = JSON.parse(
      generate(angularDistribution, { name: 'acme-studio' })['ngsw-config.json'],
    ).assetGroups as {
      name: string;
      installMode: string;
      resources: { files: string[] };
    }[];
    const i18n = groups.find((group) => group.name === 'i18n');

    expect(i18n?.installMode).toBe('prefetch');
    expect(i18n?.resources.files).toContain('/i18n/**/*.json');
  });

  it('says what is still missing before the app becomes installable', () => {
    const readme = generate(angularDistribution, { name: 'acme-studio' })['LOOMWEAVER.md'];

    expect(readme).toContain('icon-192.png');
    expect(readme).toContain('icon-512.png');
    expect(readme).toContain('apple-touch-icon');
  });

  it('puts every @import ahead of the other at-rules, as CSS requires', () => {
    const styles = generate(angularDistribution, { name: 'acme-studio' })[
      'src/styles.css'
    ];
    const atRules = styles
      .split('\n')
      .filter((line) => line.startsWith('@'))
      .map((line) => line.slice(0, line.indexOf(' ')));
    const lastImport = atRules.lastIndexOf('@import');
    const firstOther = atRules.findIndex((rule) => rule !== '@import');
    expect(lastImport).toBeGreaterThanOrEqual(0);
    expect(firstOther).toBeGreaterThan(lastImport);
  });

  describe('--styles precompiled', () => {
    const files = generate(angularDistribution, {
      name: 'acme-studio',
      styles: 'precompiled',
    });

    it('imports the stylesheet we compiled and nothing from Tailwind', () => {
      const styles = files['src/styles.css'];
      expect(styles).toContain("@import '@loomweaver/shell/styles/shell.css'");
      expect(styles).not.toContain('tailwindcss');
      expect(styles).not.toContain('@source');
      expect(styles).not.toContain('@plugin');
    });

    it('leaves @import as the only at-rule, so the file is valid CSS on its own', () => {
      const atRules = files['src/styles.css']
        .split('\n')
        .filter((line) => line.startsWith('@'));
      expect(atRules).toEqual(["@import '@loomweaver/shell/styles/shell.css';"]);
    });

    it('tells the reader how a foreign framework has to be imported', () => {
      expect(files['src/styles.css']).toContain('layer(vendor)');
      expect(files['LOOMWEAVER.md']).toContain('cascade layer');
    });

    it('changes nothing but the stylesheet and its notes', () => {
      const tailwind = generate(angularDistribution, { name: 'acme-studio' });
      const differing = Object.keys(files).filter(
        (path) => files[path] !== tailwind[path],
      );
      expect(differing.toSorted((a, b) => a.localeCompare(b))).toEqual(['LOOMWEAVER.md', 'src/styles.css']);
    });
  });

  it('reaches node_modules from whatever depth the project sits at', () => {
    const shallow = generate(angularDistribution, {
      name: 'acme-studio',
      directory: 'acme-studio',
    });
    expect(shallow['src/styles.css']).toContain(
      "@source '../../node_modules/@loomweaver/shell'",
    );
    const deep = generate(angularDistribution, {
      name: 'acme-studio',
      directory: 'apps/web/acme-studio',
    });
    expect(deep['src/styles.css']).toContain(
      "@source '../../../../node_modules/@loomweaver/shell'",
    );
  });

  it('imports provideProductIdentity from the SDK, not the shell', () => {
    const config = generate(angularDistribution, { name: 'acme-studio' })[
      'src/app/app.config.ts'
    ];
    expect(config).toContain("import { provideProductIdentity } from '@loomweaver/plugin-sdk';");
    expect(config).not.toMatch(/import \{[^}]*provideProductIdentity[^}]*\} from '@loomweaver\/shell'/);
  });

  it('keeps Angular\'s own app shape: main bootstraps App, App renders the shell', () => {
    const files = generate(angularDistribution, { name: 'acme-studio', title: 'Acme Studio' });
    expect(files['src/main.ts']).toContain('bootstrapApplication(App, appConfig)');
    expect(files['src/main.ts']).not.toContain('bootstrapApplication(Shell');
    expect(files['src/index.html']).toContain('<app-root></app-root>');
    expect(files['src/index.html']).not.toContain('<lw-shell>');
    expect(files['src/app/app.ts']).toContain("selector: 'app-root'");
    expect(files['src/app/app.ts']).toContain('imports: [Shell]');
    expect(files['src/app/app.html']).toContain('<lw-shell />');
  });

  it('puts the product wiring in app.config.ts and brands index + manifest', () => {
    const files = generate(angularDistribution, { name: 'acme-studio', title: 'Acme Studio' });
    expect(files['src/app/app.config.ts']).toContain('provideShellRouter()');
    expect(files['src/app/app.config.ts']).toContain('provideShell()');
    expect(files['src/app/app.config.ts']).toContain("name: 'Acme Studio'");
    expect(files['src/index.html']).toContain('<title>Acme Studio</title>');
    expect(files['src/styles.css']).toContain("@import 'tailwindcss'");
    expect(JSON.parse(files['public/manifest.webmanifest']).name).toBe('Acme Studio');
  });

  it('shows the way into both searches, so a first run does not hide mod+k and mod+p', () => {
    const config = generate(angularDistribution, { name: 'acme-studio' })[
      'src/app/app.config.ts'
    ];
    expect(config).toContain('provideCommandPaletteEntry()');
    expect(config).toContain('provideQuickOpenEntry()');
    expect(config).toMatch(
      /import \{[^}]*provideCommandPaletteEntry[^}]*\} from '@loomweaver\/shell'/s,
    );
    expect(config).toMatch(
      /import \{[^}]*provideQuickOpenEntry[^}]*\} from '@loomweaver\/shell'/s,
    );
  });

  it('names both shortcuts in the notes it writes beside the generated product', () => {
    const readme = generate(angularDistribution, { name: 'acme-studio' })['LOOMWEAVER.md'];
    for (const fragment of ['mod+k', 'mod+p', 'shell.commandPaletteEntry', 'shell.quickOpenEntry']) {
      expect(readme).toContain(fragment);
    }
  });

  it('supplies every required ProductIdentity field, so the scaffold type-checks', () => {
    const config = generate(angularDistribution, { name: 'acme-studio' })[
      'src/app/app.config.ts'
    ];
    for (const field of ['name:', 'tagline:', 'logoUrl:']) {
      expect(config).toContain(field);
    }
  });

  it('ships a layout whose region ids the weaver recipe targets', () => {
    const config = generate(angularDistribution, { name: 'acme-studio' })[
      'src/app/app.config.ts'
    ];
    expect(config).toContain('provideLayout(layout)');
    for (const region of ["id: 'primary', type: 'rail'", "id: 'status-bar', type: 'bar'"]) {
      expect(config).toContain(region);
    }
  });

  it('spreads providePlugins, which is variadic', () => {
    const readme = generate(angularDistribution, { name: 'acme-studio' })['LOOMWEAVER.md'];
    expect(readme).toContain('...providePlugins(');
    expect(readme).not.toMatch(/providePlugins\(\[/);
  });

  it('names the way to ship less than the whole workbench', () => {
    const files = generate(angularDistribution, { name: 'acme-studio' });
    const readme = files['LOOMWEAVER.md'];
    expect(readme).toContain('provideShellFeatures');
    expect(readme).toContain('affordance and the gesture');
    expect(readme).toContain('provideShell({ omit: [...] })');
    expect(files['src/app/app.config.ts']).toContain('provideShellFeatures');
  });

  it('never emits a README, so scaffolding over an app cannot overwrite its own', () => {
    const files = generate(angularDistribution, { name: 'acme-studio' });
    expect(Object.keys(files)).not.toContain('README.md');
  });

  it('ships a spec that runs, so the generated test target is green from the start', () => {
    const files = generate(angularDistribution, { name: 'acme-studio' });
    expect(files['src/app/app.config.spec.ts']).toContain("from './app.config'");
    expect(files['src/app/app.config.ts']).toContain('export const layout');
    expect(files['src/app/app.config.spec.ts']).not.toContain('TestBed');
  });

  it('emits no spec when the workspace runs no unit tests', () => {
    const files = generate(angularDistribution, {
      name: 'acme-studio',
      withTests: false,
    });
    expect(Object.keys(files)).not.toContain('src/app/app.config.spec.ts');
    expect(Object.keys(files)).not.toContain('src/app/app.spec.ts');
  });

  it('replaces the starter test of the application with one that boots the shell', () => {
    const files = generate(angularDistribution, { name: 'acme-studio' });
    const spec = files['src/app/app.spec.ts'];
    expect(spec).toContain("import { appConfig } from './app.config'");
    expect(spec).toContain('providers: appConfig.providers');
    expect(spec).toContain("querySelector('lw-shell')");
    expect(spec).not.toContain('h1');
  });

  it('does not reference a stylesheet it never emits', () => {
    const files = generate(angularDistribution, { name: 'acme-studio' });
    expect(files['src/app/app.ts']).not.toContain('styleUrl');
  });
});

import {
  ensureBuildTarget,
  ensurePostcssPlugin,
  ensureStylesheetSource,
  joinProjectPath,
} from './merge';
import { BuildTargetAmendment, PostcssAmendment } from './types';

const POSTCSS: PostcssAmendment = {
  kind: 'postcss',
  file: '.postcssrc.json',
  plugin: '@tailwindcss/postcss',
};

const TARGET: BuildTargetAmendment = {
  kind: 'build-target',
  styles: ['src/styles.css'],
  assets: [
    { glob: '**/*', input: 'public', from: 'project' },
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

describe('joinProjectPath', () => {
  it('leaves a path alone for a project at the workspace root', () => {
    expect(joinProjectPath('', 'src/styles.css')).toBe('src/styles.css');
  });

  it('prefixes a nested project', () => {
    expect(joinProjectPath('apps/studio', 'src/styles.css')).toBe(
      'apps/studio/src/styles.css',
    );
  });
});

describe('ensurePostcssPlugin', () => {
  it('creates the configuration where none exists', () => {
    const result = ensurePostcssPlugin(undefined, POSTCSS);
    expect(result.value).toEqual({ plugins: { '@tailwindcss/postcss': {} } });
    expect(result.added).toHaveLength(1);
  });

  it('adds the plugin beside the ones already configured', () => {
    const result = ensurePostcssPlugin({ plugins: { autoprefixer: {} } }, POSTCSS);
    expect(Object.keys(result.value['plugins'] as object).toSorted()).toEqual([
      '@tailwindcss/postcss',
      'autoprefixer',
    ]);
  });

  it('changes nothing when the plugin is already configured', () => {
    const existing = { plugins: { '@tailwindcss/postcss': { some: 'option' } } };
    const result = ensurePostcssPlugin(existing, POSTCSS);
    expect(result.value).toEqual(existing);
    expect(result.added).toHaveLength(0);
  });
});

describe('ensureBuildTarget', () => {
  it('adds the wiring an untouched Angular build target lacks', () => {
    const result = ensureBuildTarget(
      { options: { browser: 'src/main.ts', assets: [], styles: [] } },
      TARGET,
      '',
    );
    const options = result.value['options'] as Record<string, unknown>;
    expect(options['styles']).toEqual(['src/styles.css']);
    expect(options['assets']).toEqual([
      { glob: '**/*', input: 'public' },
      {
        glob: '**/*',
        input: 'node_modules/@loomweaver/shell/i18n',
        output: 'i18n',
      },
    ]);
    const production = (
      result.value['configurations'] as Record<string, Record<string, unknown>>
    )['production'];
    expect(production['serviceWorker']).toBe('ngsw-config.json');
    expect(production['optimization']).toEqual({
      styles: { inlineCritical: false },
    });
  });

  it('resolves a nested project the way each entry names itself', () => {
    const result = ensureBuildTarget({}, TARGET, 'apps/studio');
    const options = result.value['options'] as Record<string, unknown>;
    expect(options['styles']).toEqual(['apps/studio/src/styles.css']);
    expect(options['assets']).toEqual([
      { glob: '**/*', input: 'apps/studio/public' },
      {
        glob: '**/*',
        input: 'node_modules/@loomweaver/shell/i18n',
        output: 'i18n',
      },
    ]);
  });

  it('keeps every value the consumer already chose', () => {
    const existing = {
      options: {
        styles: ['src/styles.css', 'src/extra.css'],
        assets: [{ glob: '**/*', input: 'public', output: 'static' }],
      },
      configurations: {
        production: {
          serviceWorker: 'my-ngsw.json',
          optimization: { styles: { inlineCritical: true } },
        },
      },
    };
    const result = ensureBuildTarget(existing, TARGET, '');
    const options = result.value['options'] as Record<string, unknown>;
    expect(options['styles']).toEqual(['src/styles.css', 'src/extra.css']);
    expect((options['assets'] as unknown[])[0]).toEqual({
      glob: '**/*',
      input: 'public',
      output: 'static',
    });
    const production = (
      result.value['configurations'] as Record<string, Record<string, unknown>>
    )['production'];
    expect(production['serviceWorker']).toBe('my-ngsw.json');
    expect(production['optimization']).toEqual({
      styles: { inlineCritical: true },
    });
  });

  it('changes nothing on a second application', () => {
    const once = ensureBuildTarget({}, TARGET, '');
    const twice = ensureBuildTarget(once.value, TARGET, '');
    expect(twice.value).toEqual(once.value);
    expect(twice.added).toHaveLength(0);
  });

  it('declines a boolean optimization and says what it costs', () => {
    const result = ensureBuildTarget(
      { configurations: { production: { optimization: true } } },
      TARGET,
      '',
    );
    expect(result.declined.join(' ')).toContain('renders unstyled');
  });
});

describe('ensureStylesheetSource', () => {
  it('appends a source the stylesheet does not name', () => {
    expect(ensureStylesheetSource("@import 'tailwindcss';\n", '../notes/src')).toContain(
      "@source '../notes/src';",
    );
  });

  it('leaves a stylesheet that already names it alone', () => {
    const css = "@import 'tailwindcss';\n\n@source '../notes/src';\n";
    expect(ensureStylesheetSource(css, '../notes/src')).toBe(css);
  });
});

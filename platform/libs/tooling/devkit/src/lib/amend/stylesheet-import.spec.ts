import { ensureStylesheetImport, importSpecifier } from './stylesheet-import';

const TAILWIND = `@import 'tailwindcss';
@import '@loomweaver/shell/styles/theme.css';

@plugin '@tailwindcss/typography';
`;

describe('ensureStylesheetImport', () => {
  it('imports the file directly after the shell styles', () => {
    const result = ensureStylesheetImport(TAILWIND, './themes/ocean.css', '@loomweaver/shell/styles/');

    expect(result.anchored).toBe(true);
    expect(result.css).toBe(`@import 'tailwindcss';
@import '@loomweaver/shell/styles/theme.css';
@import './themes/ocean.css';

@plugin '@tailwindcss/typography';
`);
  });

  it('changes nothing when the import is there', () => {
    const once = ensureStylesheetImport(TAILWIND, './themes/ocean.css', '@loomweaver/shell/styles/').css;

    expect(ensureStylesheetImport(once, './themes/ocean.css', '@loomweaver/shell/styles/').css).toBe(once);
  });

  it('goes after the last import, never below a rule, where the shell styles are imported otherwise', () => {
    const css = "@import 'bootstrap.css';\n\nbody { margin: 0; }\n";
    const result = ensureStylesheetImport(css, './themes/ocean.css', '@loomweaver/shell/styles/');

    expect(result.anchored).toBe(false);
    expect(result.css).toBe("@import 'bootstrap.css';\n@import './themes/ocean.css';\n\nbody { margin: 0; }\n");
  });

  it('names the file relative to the stylesheet that imports it', () => {
    expect(importSpecifier('apps/studio/src/styles.css', 'apps/studio/src/themes/ocean.css')).toBe(
      './themes/ocean.css',
    );
    expect(importSpecifier('apps/studio/src/styles.css', 'libs/brand/ocean.css')).toBe(
      '../../../libs/brand/ocean.css',
    );
  });
});

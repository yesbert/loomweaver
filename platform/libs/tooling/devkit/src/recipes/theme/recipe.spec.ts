import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { generate } from '../../lib/generate/generate';
import { resolveThemeInput, theme } from './recipe';

const TOKEN_LIST_FROM_WORKSPACE_ROOT =
  'libs/core/shell/src/lib/theme/theme-registry-global.ts';

function shellTokens(): string[] {
  const file = join(process.cwd(), '..', '..', '..', TOKEN_LIST_FROM_WORKSPACE_ROOT);
  if (!existsSync(file)) {
    throw new Error(
      `Expected ${TOKEN_LIST_FROM_WORKSPACE_ROOT} under the workspace root. This spec is the only ` +
        'thing keeping the bootstrap preset in step with the shell, and the Nx boundary stops ' +
        'devkit from importing it. Repoint the path, do not delete the check.',
    );
  }
  const source = readFileSync(file, 'utf8');
  const list = /export const LW_TOKENS = \[([\s\S]*?)\] as const;/.exec(source);
  if (!list) throw new Error(`No LW_TOKENS array found in ${TOKEN_LIST_FROM_WORKSPACE_ROOT}.`);
  return [...list[1].matchAll(/'(--lw-[a-z-]+)'/g)].map((m) => m[1]);
}

describe('theme recipe', () => {
  it('rejects a non-kebab name', () => {
    expect(() => resolveThemeInput({ name: 'Midnight' })).toThrow(/kebab-case/);
  });

  it('emits a token-override CSS with light and dark ladders', () => {
    const css = generate(theme, { name: 'midnight' })['midnight.css'];
    expect(css).toContain('@layer lw-tenant-theme {');
    expect(css).toContain(':root {');
    expect(css).toContain(':root.dark {');
    expect(css).toContain('--lw-brand:');
    expect(css).toContain('--lw-surface:');
    expect(css).toContain('--lw-content:');
  });

  it('rejects an unknown preset', () => {
    expect(() =>
      resolveThemeInput({ name: 'acme', preset: 'tailwind' as never }),
    ).toThrow(/Unknown theme preset/);
  });

  describe('bootstrap preset', () => {
    const css = generate(theme, { name: 'acme', preset: 'bootstrap' })['acme.css'];

    it('covers the whole token ladder, so nothing silently keeps the product default', () => {
      const declared = [...css.matchAll(/^\s*(--lw-[a-z-]+):/gm)].map((m) => m[1]);
      expect(new Set(declared).size).toBe(declared.length);
      expect([...declared].toSorted((a, b) => a.localeCompare(b))).toEqual([...shellTokens()].toSorted((a, b) => a.localeCompare(b)));
    });

    it('reads Bootstrap variables rather than baking in colours', () => {
      expect(css).toContain('--lw-brand: var(--bs-primary)');
      expect(css).toContain('--lw-surface: var(--bs-body-bg)');
      expect(css).toContain('--lw-content: var(--bs-body-color)');
      expect(css).toContain('--lw-font-sans: var(--bs-body-font-family)');
    });

    it('points text tokens at -text-emphasis, which is the contrast-safe one', () => {
      expect(css).toContain('--lw-brand-text: var(--bs-primary-text-emphasis)');
      expect(css).not.toContain('--lw-brand-text: var(--bs-primary)');
    });

    it('keeps on-* tokens literal, because they must contrast with the fill, not follow it', () => {
      expect(css).toContain('--lw-on-brand: #fff');
      expect(css).toContain('--lw-on-caution: #000');
      expect(css).toContain('--lw-on-info: #000');
    });

    it('writes no dark block — Bootstrap flips its own variables under data-bs-theme', () => {
      expect(css).not.toMatch(/:root\.dark\s*\{/);
      expect(css).toContain('data-bs-theme');
    });

    it('nests no comment terminator, which would truncate the generated CSS', () => {
      expect(css.indexOf('*/')).toBe(css.lastIndexOf('*/'));
    });

    it('tells the consumer to layer Bootstrap, without which its reset wins', () => {
      expect(css).toContain('layer(vendor)');
      expect(css).toContain('border-radius: 0');
    });
  });
});

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SCRIPT_FROM_WORKSPACE_ROOT = 'libs/core/shell/build-styles.mjs';

describe('shell stylesheet build', () => {
  const out = mkdtempSync(join(tmpdir(), 'lw-shell-styles-'));
  let css = '';

  beforeAll(() => {
    const script = join(process.cwd(), SCRIPT_FROM_WORKSPACE_ROOT);
    if (!existsSync(script)) {
      throw new Error(
        `Expected ${SCRIPT_FROM_WORKSPACE_ROOT} under the workspace root (${process.cwd()}). ` +
          'This spec anchors on the working directory rather than on its own location, because ' +
          'the coverage configuration bundles specs into the workspace root, which leaves both ' +
          '__dirname and import.meta.url pointing there instead of at this file.',
      );
    }
    execFileSync(process.execPath, [script], {
      env: { ...process.env, LW_SHELL_STYLES_OUT: out },
      stdio: 'pipe',
    });
    css = readFileSync(join(out, 'shell.css'), 'utf8');
  }, 180_000);

  it('resolves every Tailwind directive to plain CSS', () => {
    expect(css).not.toContain('@apply');
    expect(css).not.toContain('@utility');
    expect(css).not.toContain('@plugin');
    expect(css).not.toContain('@source');
  });

  it('carries the design tokens in both ladders', () => {
    expect(css).toContain('--lw-brand');
    expect(css).toContain('--lw-surface');
    expect(css).toMatch(/:root\.dark|\.dark/);
  });

  it('carries the .lw-* class contracts', () => {
    for (const contract of ['.lw-btn', '.lw-field', '.lw-scrim', '.lw-badge']) {
      expect(css).toContain(contract);
    }
  });

  it('carries the utilities the shell templates use, so no Tailwind run is needed', () => {
    for (const utility of ['.flex', '.truncate', '.shrink-0']) {
      expect(css).toContain(utility);
    }
  });

  it('keeps its style rules inside cascade layers, so consumer CSS outranks them', async () => {
    const postcss = (await import('postcss')).default;
    const unlayered: string[] = [];
    postcss.parse(css).each((node) => {
      if (node.type === 'rule') unlayered.push(node.selector);
    });
    expect(unlayered).toEqual(['html,body', 'body']);
  });

  it('bakes in no version of ours, which would drift against the stamped manifest', () => {
    expect(css).not.toMatch(/@loomweaver\/shell\s+\d+\.\d+\.\d+/);
  });
});

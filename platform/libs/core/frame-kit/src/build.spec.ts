import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('frame-kit build', () => {
  const out = mkdtempSync(join(tmpdir(), 'lw-frame-kit-'));

  beforeAll(() => {
    execFileSync(process.execPath, [join(__dirname, '..', 'build.mjs')], {
      env: { ...process.env, LW_FRAME_KIT_OUT: out },
      stdio: 'pipe',
    });
  }, 120_000);

  it('bundles the whole element family with the LwFrame api', () => {
    const js = readFileSync(join(out, 'lw-elements.global.js'), 'utf8');
    for (const tag of [
      'lw-tooltip',
      'lw-select',
      'lw-option',
      'lw-menu',
      'lw-menu-item',
      'lw-button',
      'lw-markdown',
      'lw-icon',
      'lw-progress-ring',
    ]) {
      expect(js).toContain(tag);
    }
    expect(js).toContain('LwFrame');
  });

  it('seeds the built-in icon set into the bundle', () => {
    const js = readFileSync(join(out, 'lw-elements.global.js'), 'utf8');
    expect(js).toContain('<svg');
  });

  it('compiles the .lw-* class contracts to plain CSS on tokens', () => {
    const css = readFileSync(join(out, 'lw-frame.css'), 'utf8');
    expect(css).toContain('.lw-btn');
    expect(css).toContain('.lw-tooltip-bubble');
    expect(css).toContain('lw-menu-item');
    expect(css).toContain('var(--lw-');
    expect(css).toContain('.prose');
    expect(css).not.toContain('@apply');
  });

  it('carries the token fallback ladder for the pre-push blink', () => {
    const css = readFileSync(join(out, 'lw-frame.css'), 'utf8');
    expect(css).toContain('--lw-brand');
    expect(css).toContain(':root.dark');
  });

  it('vendors Penpal as a global bundle', () => {
    const js = readFileSync(join(out, 'penpal.global.js'), 'utf8');
    expect(js).toContain('Penpal');
    expect(js).toContain('WindowMessenger');
  });
});

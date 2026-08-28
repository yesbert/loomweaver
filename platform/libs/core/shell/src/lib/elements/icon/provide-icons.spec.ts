import { EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { IconRegistry } from './icon-registry';
import {
  distributionIcons,
  resolveIcon,
  setIcon,
} from './icon-registry-global';
import { LOOM_ICONS } from './loom-icons';
import { provideIcons } from './provide-icons';

const BRAND = '<svg viewBox="0 0 3 3"><path d="M1 1h1"/></svg>';
const PLUGIN = '<svg viewBox="0 0 4 4"><path d="M2 2h2"/></svg>';

const bootstrap = (icons: Record<string, string>): void => {
  TestBed.configureTestingModule({ providers: [provideIcons(icons)] });
  TestBed.inject(EnvironmentInjector);
};

describe('provideIcons (distribution-level icons)', () => {
  afterEach(() => setIcon('trash', LOOM_ICONS.trash));

  it('replaces a first-party glyph, which the old first-wins rule silently refused', () => {
    expect(resolveIcon('trash')).toBe(LOOM_ICONS.trash);

    bootstrap({ trash: BRAND });

    expect(resolveIcon('trash')).toBe(BRAND);
  });

  it('still adds a name the shell does not ship', () => {
    bootstrap({ 'test.report': BRAND });
    expect(resolveIcon('test.report')).toBe(BRAND);
  });

  it('keeps a plugin from taking a name the distribution replaced', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    bootstrap({ trash: BRAND });

    new IconRegistry().register('notes', { trash: PLUGIN });

    expect(resolveIcon('trash')).toBe(BRAND);
    warn.mockRestore();
  });

  it('offers only its own icons for the sandbox, never a plugin contribution', () => {
    bootstrap({ trash: BRAND });
    const disposable = new IconRegistry().register('notes', {
      'test.plugin-own': PLUGIN,
    });

    expect(distributionIcons()['trash']).toBe(BRAND);
    expect(distributionIcons()['test.plugin-own']).toBeUndefined();
    expect(resolveIcon('test.plugin-own')).toContain('M2 2h2');

    disposable.dispose();
  });
});

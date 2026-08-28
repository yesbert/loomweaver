import { TestBed } from '@angular/core/testing';
import { ThemeRegistry } from './theme-registry';

describe('ThemeRegistry', () => {
  let registry: ThemeRegistry;

  beforeEach(() => {
    registry = TestBed.inject(ThemeRegistry);
  });

  it('bumps version on register and on dispose', () => {
    const before = registry.version();
    const handle = registry.register('testbed', { '--lw-brand': '#0e7490' });
    expect(registry.version()).toBe(before + 1);
    handle.dispose();
    expect(registry.version()).toBe(before + 2);
  });

  it('ignores unknown tokens (warns) without throwing', () => {
    const warn = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);
    expect(() =>
      registry.register('testbed', { '--lw-nope': 'x' }).dispose(),
    ).not.toThrow();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

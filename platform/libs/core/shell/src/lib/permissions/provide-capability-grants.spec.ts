import { effectiveCapabilities } from './provide-capability-grants';

describe('effectiveCapabilities', () => {
  it('intersects the grant with the declaration — an undeclared grant is inert', () => {
    const effective = effectiveCapabilities(
      'p',
      ['contributions', 'navigation'],
      ['contributions'],
    );

    expect(effective.has('contributions')).toBe(true);
    expect(effective.has('navigation')).toBe(false);
  });

  it('keeps the grant as-is when the plugin declares nothing (declaring is optional today)', () => {
    const effective = effectiveCapabilities(
      'p',
      ['contributions', 'ui'],
      undefined,
    );

    expect(effective.has('contributions')).toBe(true);
    expect(effective.has('ui')).toBe(true);
  });

  it('is empty for a missing grant (default-deny)', () => {
    expect(effectiveCapabilities('p', undefined, ['contributions']).size).toBe(
      0,
    );
  });
});

import { validateManifest } from './manifest';

describe('validateManifest', () => {
  it('passes a well-formed manifest', () => {
    expect(
      validateManifest({ id: 'notes', name: 'Notes', capabilities: ['contributions', 'navigation'] }),
    ).toEqual([]);
  });

  it('flags a non-kebab id', () => {
    const findings = validateManifest({ id: 'Notes' });
    expect(findings).toHaveLength(1);
    expect(findings[0].code).toBe('manifest.id');
    expect(findings[0].level).toBe('error');
  });

  it('flags an unknown capability', () => {
    const findings = validateManifest({ id: 'notes', capabilities: ['contributions', 'root'] });
    expect(findings.map((f) => f.code)).toContain('manifest.capability.unknown');
  });

  it('warns on a duplicate capability', () => {
    const findings = validateManifest({ id: 'notes', capabilities: ['ui', 'ui'] });
    const dup = findings.find((f) => f.code === 'manifest.capability.duplicate');
    expect(dup?.level).toBe('warning');
  });

  it('rejects a non-array capabilities value', () => {
    const findings = validateManifest({ id: 'notes', capabilities: 'ui' });
    expect(findings.map((f) => f.code)).toContain('manifest.capabilities');
  });

  it('honours an injected capability list', () => {
    expect(validateManifest({ id: 'notes', capabilities: ['files'] }, ['files'])).toEqual([]);
  });
});

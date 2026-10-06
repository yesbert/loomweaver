import { validateManifest } from './manifest';

describe('validateManifest', () => {
  it('passes a well-formed manifest', () => {
    expect(
      validateManifest({ id: 'notes', name: 'Notes', capabilities: ['contributions', 'navigation'] }),
    ).toEqual([]);
  });

  it('warns on a non-kebab id, saying the workbench accepts it', () => {
    const findings = validateManifest({ id: 'Notes' });
    expect(findings).toHaveLength(1);
    expect(findings[0].code).toBe('manifest.id.convention');
    expect(findings[0].level).toBe('warning');
    expect(findings[0].message).toContain('The workbench accepts it');
  });

  it('refuses an id that is missing, empty or not a string', () => {
    for (const id of [undefined, '', '  ', 42]) {
      const [finding] = validateManifest({ id });
      expect(finding.code).toBe('manifest.id');
      expect(finding.level).toBe('error');
    }
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

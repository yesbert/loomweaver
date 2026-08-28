import { validateCatalog, CATALOG_ENTRY_KEYS } from './catalog';

const valid = {
  id: 'report-tool',
  name: 'Report tool',
  entryUrl: '/report-tool/plugin.html',
  capabilities: ['contributions', 'ui'],
  version: '1.0.0',
};

function codes(catalog: unknown): string[] {
  return validateCatalog(catalog).map((finding) => finding.code);
}

describe('validateCatalog', () => {
  it('passes a well-formed catalog', () => {
    expect(validateCatalog([valid])).toEqual([]);
  });

  it('rejects anything that is not an array', () => {
    expect(codes({ plugins: [valid] })).toEqual(['catalog.shape']);
  });

  describe('what makes the host drop the whole entry', () => {
    it('flags a missing id', () => {
      expect(codes([{ ...valid, id: undefined }])).toContain('catalog.id');
    });

    it('flags a missing entryUrl', () => {
      expect(codes([{ ...valid, entryUrl: undefined }])).toContain(
        'catalog.entryUrl',
      );
    });

    it('flags a non-object entry', () => {
      expect(codes(['report-tool'])).toEqual(['catalog.entry']);
    });
  });

  describe('what the host drops field by field', () => {
    it('flags an unknown capability, because the host filters it out silently', () => {
      const findings = validateCatalog([
        { ...valid, capabilities: ['contributions', 'uii'] },
      ]);
      expect(findings.map((f) => f.code)).toEqual([
        'catalog.capability.unknown',
      ]);
      expect(findings[0].level).toBe('error');
      expect(findings[0].message).toContain('CapabilityError');
    });

    it('flags a non-http repository', () => {
      expect(codes([{ ...valid, repository: 'git@github.com:acme/x.git' }])).toEqual(
        ['catalog.repository'],
      );
    });

    it('flags a negative download count', () => {
      expect(codes([{ ...valid, downloads: -1 }])).toEqual([
        'catalog.downloads',
      ]);
    });

    it('flags an unparseable updated date', () => {
      expect(codes([{ ...valid, updated: 'last tuesday' }])).toEqual([
        'catalog.updated',
      ]);
    });

    it('accepts a date the store can render', () => {
      expect(validateCatalog([{ ...valid, updated: '2026-07-15' }])).toEqual([]);
    });
  });

  describe('URLs the host resolves against its own origin', () => {
    it('rejects a non-http scheme outright', () => {
      const findings = validateCatalog([
        { ...valid, entryUrl: 'javascript:alert(1)' },
      ]);
      expect(findings[0].code).toBe('catalog.url.scheme');
      expect(findings[0].level).toBe('error');
    });

    it('warns on an absolute URL, which it cannot judge from here', () => {
      const findings = validateCatalog([
        { ...valid, entryUrl: 'https://cdn.example.com/x/plugin.html' },
      ]);
      expect(findings.map((f) => f.code)).toEqual(['catalog.url.absolute']);
      expect(findings[0].level).toBe('warning');
    });

    it('accepts a root-relative URL without comment', () => {
      expect(validateCatalog([{ ...valid, readmeUrl: '/x/README.md' }])).toEqual(
        [],
      );
    });
  });

  describe('the mistakes a catalog cannot report on its own', () => {
    it('names a field the host never reads', () => {
      const findings = validateCatalog([{ ...valid, discription: 'oops' }]);
      expect(findings.map((f) => f.code)).toEqual(['catalog.unknown-key']);
      expect(findings[0].message).toContain('discription');
      expect(findings[0].message).toContain('description');
    });

    it('accepts every key the host does read', () => {
      const everything = Object.fromEntries(
        CATALOG_ENTRY_KEYS.map((key) => [key, 'x']),
      );
      const findings = validateCatalog([
        { ...everything, ...valid, downloads: 1, updated: '2026-07-15' },
      ]);
      expect(findings.filter((f) => f.code === 'catalog.unknown-key')).toEqual(
        [],
      );
    });

    it('warns about a missing version, because updates hang off it', () => {
      const findings = validateCatalog([{ ...valid, version: undefined }]);
      expect(findings.map((f) => f.code)).toEqual([
        'catalog.version.missing',
      ]);
      expect(findings[0].message).toContain('respawn');
    });

    it('warns about missing capabilities, which grants the plugin nothing', () => {
      expect(codes([{ ...valid, capabilities: undefined }])).toEqual([
        'catalog.capabilities.missing',
      ]);
    });

    it('warns about a duplicate id, since only the first survives', () => {
      expect(codes([valid, { ...valid, name: 'Second' }])).toEqual([
        'catalog.id.duplicate',
      ]);
    });

    it('warns about a missing name, which falls back to the id', () => {
      expect(codes([{ ...valid, name: undefined }])).toEqual([
        'catalog.name.missing',
      ]);
    });
  });

  it('honours an injected capability vocabulary', () => {
    expect(
      validateCatalog([{ ...valid, capabilities: ['weird'] }], ['weird']),
    ).toEqual([]);
  });

  it('points every finding at the entry it came from', () => {
    const findings = validateCatalog([valid, { id: 'x' }]);
    expect(findings.every((f) => f.path?.startsWith('catalog[1]'))).toBe(true);
  });
});

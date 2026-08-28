import {
  addedCapabilities,
  availableUpdate,
  isNewerVersion,
} from './plugin-update';
import { InstalledPlugin, PluginCatalogEntry } from '../installed-plugin';

const installed: InstalledPlugin = {
  id: 'testbed',
  name: 'Demo',
  entryUrl: '/demo/plugin.html',
  version: '1.2.0',
  capabilities: ['ui'],
};

const catalogEntry = (patch: Partial<PluginCatalogEntry>): PluginCatalogEntry =>
  ({ ...installed, ...patch }) as PluginCatalogEntry;

describe('isNewerVersion', () => {
  it('compares segments numerically, not as strings', () => {
    expect(isNewerVersion('1.10.0', '1.9.0')).toBe(true);
    expect(isNewerVersion('1.9.0', '1.10.0')).toBe(false);
  });

  it('treats a missing segment as zero', () => {
    expect(isNewerVersion('1.2.1', '1.2')).toBe(true);
    expect(isNewerVersion('1.2', '1.2.0')).toBe(false);
  });

  it('never claims an update without both versions', () => {
    expect(isNewerVersion(undefined, '1.0.0')).toBe(false);
    expect(isNewerVersion('2.0.0', undefined)).toBe(false);
    expect(isNewerVersion('1.2.0', '1.2.0')).toBe(false);
  });
});

describe('availableUpdate', () => {
  it('returns the catalog entry when it is newer', () => {
    const newer = catalogEntry({ version: '1.3.0' });
    expect(availableUpdate(installed, newer)).toBe(newer);
  });

  it('returns nothing for an equal, older or unknown entry', () => {
    expect(availableUpdate(installed, catalogEntry({}))).toBeUndefined();
    expect(
      availableUpdate(installed, catalogEntry({ version: '1.1.0' })),
    ).toBeUndefined();
    expect(availableUpdate(undefined, catalogEntry({}))).toBeUndefined();
    expect(availableUpdate(installed, undefined)).toBeUndefined();
  });
});

describe('addedCapabilities', () => {
  it('lists only capabilities the user never consented to', () => {
    expect(
      addedCapabilities(
        catalogEntry({ capabilities: ['ui', 'navigation'] }),
        installed,
      ),
    ).toEqual(['navigation']);
  });

  it('is empty when the declaration did not grow', () => {
    expect(
      addedCapabilities(catalogEntry({ capabilities: ['ui'] }), installed),
    ).toEqual([]);
    expect(addedCapabilities(catalogEntry({}), installed)).toEqual([]);
  });
});

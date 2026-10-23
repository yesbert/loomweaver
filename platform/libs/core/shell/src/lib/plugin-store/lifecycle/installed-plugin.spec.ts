import { parseInstalledPlugin } from './installed-plugin';

const entry = (overrides: Record<string, unknown> = {}) => ({
  id: 'acme.notes',
  name: 'Notes',
  entryUrl: '/plugins/notes/plugin.html',
  ...overrides,
});

describe('reading an installed or offered plugin', () => {
  it('keeps an identity of lower-case letters, digits, dots and hyphens', () => {
    expect(parseInstalledPlugin(entry({ id: 'acme.notes-2' }))?.id).toBe('acme.notes-2');
  });

  it('refuses an identity in the workbench namespace', () => {
    expect(parseInstalledPlugin(entry({ id: 'shell' }))).toBeUndefined();
    expect(parseInstalledPlugin(entry({ id: 'shell.permissions' }))).toBeUndefined();
  });

  it('refuses an identity outside the form', () => {
    for (const id of ['acme:docs', 'Acme', 'acme notes', '.acme', '-acme', '']) {
      expect(parseInstalledPlugin(entry({ id }))).toBeUndefined();
    }
  });

  it('refuses an entry address that carries its content inline, even from its own origin', () => {
    expect(
      parseInstalledPlugin(entry({ entryUrl: `blob:${location.origin}/0b1c2d3e` })),
    ).toBeUndefined();
  });
});

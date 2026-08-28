import { findScaffold, SCAFFOLDS } from '@loomweaver/devkit';
import {
  listGenerators,
  scaffold,
  toolName,
  validateCatalogTool,
  validateI18nTool,
  validateManifestTool,
} from './tools';

function must(name: string) {
  const descriptor = findScaffold(name);
  if (!descriptor) {
    throw new Error(`No scaffold named ${name}`);
  }
  return descriptor;
}

function files(name: string, args: Record<string, unknown>) {
  return scaffold(must(name), args).structuredContent['files'] as Record<
    string,
    string
  >;
}

describe('mcp tools', () => {
  it('lists every scaffold the devkit declares', () => {
    const names = (
      listGenerators().structuredContent['generators'] as { name: string }[]
    ).map((generator) => generator.name);
    expect(names).toEqual(SCAFFOLDS.map((s) => s.name));
  });

  it('derives the tool name from the scaffold name', () => {
    expect(toolName(must('frame-plugin'))).toBe('scaffold_frame_plugin');
    expect(toolName(must('weaver'))).toBe('scaffold_weaver');
  });

  it('returns a file map and honours features', () => {
    const map = files('weaver', { id: 'notes', about: true, settings: true });
    expect(map['src/lib/plugin/notes.plugin.ts']).toContain('notesPlugin');
    expect(map['src/lib/dialogs/notes-about-dialog.ts']).toBeDefined();
    expect(map['src/lib/plugin/notes.plugin.ts']).toContain(
      'ctx.registerSettingsSection(',
    );
  });

  it('scaffolds each artifact type', () => {
    expect(Object.keys(files('frame-plugin', { id: 'notes' }))).toContain(
      'plugin.js',
    );
    expect(
      Object.keys(files('distribution', { name: 'acme-studio' })),
    ).toContain('src/main.ts');
    expect(Object.keys(files('auth-source', { name: 'dev' }))).toContain(
      'dev-auth-source.ts',
    );
    expect(Object.keys(files('settings-store', { name: 'backend' }))).toContain(
      'backend-settings-store.ts',
    );
    expect(Object.keys(files('theme', { name: 'midnight' }))).toContain(
      'midnight.css',
    );
    expect(Object.keys(files('layout', {}))).toContain('base-layout.ts');
  });

  it('ignores workspace-shaped options — an MCP client has nowhere to put them', () => {
    const map = files('weaver', { id: 'notes', directory: 'libs/elsewhere' });
    expect(Object.keys(map)).toContain('src/index.ts');
    expect(Object.keys(map).every((path) => !path.includes('libs/'))).toBe(true);
  });

  it('validate_manifest flags an unknown capability', () => {
    const findings = validateManifestTool({
      id: 'notes',
      capabilities: ['root'],
    }).structuredContent['findings'] as { code: string }[];
    expect(
      findings.some((f) => f.code === 'manifest.capability.unknown'),
    ).toBe(true);
  });

  it('validate_i18n flags a missing key', () => {
    const findings = validateI18nTool({
      bundles: { en: { a: '1', b: '2' }, de: { a: '1' } },
    }).structuredContent['findings'] as unknown[];
    expect(findings).toHaveLength(1);
  });

  it('validate_catalog names a field the host never reads', () => {
    const findings = validateCatalogTool({
      catalog: [
        {
          id: 'report-tool',
          name: 'Report tool',
          entryUrl: '/report-tool/plugin.html',
          capabilities: ['contributions'],
          version: '1.0.0',
          discription: 'oops',
        },
      ],
    }).structuredContent['findings'] as { code: string }[];
    expect(findings.map((f) => f.code)).toEqual(['catalog.unknown-key']);
  });

  it('surfaces a scaffold error for an invalid id', () => {
    expect(() => files('weaver', { id: 'Bad Id' })).toThrow(/kebab-case/);
  });
});

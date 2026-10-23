import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadTypeScript, TYPESCRIPT_COMPATIBILITY_PACKAGE } from './typescript';

const projects: string[] = [];

function project(packages: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'lw-ts-lookup-'));
  projects.push(root);
  writeFileSync(join(root, 'package.json'), '{ "name": "probe", "private": true }');
  for (const [name, body] of Object.entries(packages)) {
    const dir = join(root, 'node_modules', name);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name, main: 'index.js' }));
    writeFileSync(join(dir, 'index.js'), body);
  }
  return root;
}

const NATIVE = "module.exports = { version: '7.0.2', versionMajorMinor: '7.0' };";
const WITH_INTERFACE = (version: string) =>
  `module.exports = { version: '${version}', createSourceFile() { return {}; } };`;

afterEach(() => {
  for (const root of projects.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('loadTypeScript', () => {
  it('returns a TypeScript that can read a source file', () => {
    const root = project({ typescript: WITH_INTERFACE('6.0.3') });

    expect(loadTypeScript(root, root).ts?.version).toBe('6.0.3');
  });

  it('reports a TypeScript without the interface, with its version', () => {
    const root = project({ typescript: NATIVE });

    expect(loadTypeScript(root, root)).toEqual({ ts: null, withoutInterface: '7.0.2' });
  });

  it('reads through the compatibility release installed beside it', () => {
    const root = project({
      typescript: NATIVE,
      [TYPESCRIPT_COMPATIBILITY_PACKAGE]: WITH_INTERFACE('6.0.2'),
    });

    expect(loadTypeScript(root, root).ts?.version).toBe('6.0.2');
  });

  it('prefers the project TypeScript while it has the interface', () => {
    const root = project({
      typescript: WITH_INTERFACE('6.0.3'),
      [TYPESCRIPT_COMPATIBILITY_PACKAGE]: WITH_INTERFACE('6.0.2'),
    });

    expect(loadTypeScript(root, root).ts?.version).toBe('6.0.3');
  });

  it('reports no TypeScript where none is installed', () => {
    const root = project({});

    expect(loadTypeScript(root, root)).toEqual({ ts: null });
  });
});

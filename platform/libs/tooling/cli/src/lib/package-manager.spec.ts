import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  detectPackageManager,
  execCommand,
  installCommand,
  packageManagerFrom,
  runScriptCommand,
} from './package-manager';

describe('package manager', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'loom-pm-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('reads the manager off the lockfile and falls back to npm', () => {
    expect(detectPackageManager(dir)).toEqual({ manager: 'npm' });
    writeFileSync(join(dir, 'bun.lockb'), '');
    expect(detectPackageManager(dir)).toEqual({
      manager: 'bun',
      lockfile: 'bun.lockb',
    });
    writeFileSync(join(dir, 'yarn.lock'), '');
    expect(detectPackageManager(dir).manager).toBe('yarn');
    writeFileSync(join(dir, 'pnpm-lock.yaml'), '');
    expect(detectPackageManager(dir).manager).toBe('pnpm');
    writeFileSync(join(dir, 'package-lock.json'), '{}');
    expect(detectPackageManager(dir).manager).toBe('npm');
  });

  it('spells install, dev install, exec and a script per manager', () => {
    expect(installCommand('npm', ['a'], false)).toEqual([
      'npm',
      'install',
      'a',
    ]);
    expect(installCommand('npm', ['a'], true)).toEqual([
      'npm',
      'install',
      '-D',
      'a',
    ]);
    expect(installCommand('pnpm', ['a'], true)).toEqual([
      'pnpm',
      'add',
      '-D',
      'a',
    ]);
    expect(installCommand('yarn', ['a'], false)).toEqual(['yarn', 'add', 'a']);
    expect(installCommand('bun', ['a'], true)).toEqual([
      'bun',
      'add',
      '-d',
      'a',
    ]);
    expect(execCommand('npm', ['nx', 'serve'])).toEqual(['npx', 'nx', 'serve']);
    expect(execCommand('pnpm', ['nx', 'serve'])).toEqual([
      'pnpm',
      'exec',
      'nx',
      'serve',
    ]);
    expect(execCommand('yarn', ['nx', 'serve'])).toEqual([
      'yarn',
      'nx',
      'serve',
    ]);
    expect(execCommand('bun', ['nx', 'serve'])).toEqual([
      'bunx',
      'nx',
      'serve',
    ]);
    expect(runScriptCommand('yarn', 'start')).toBe('yarn start');
  });

  it('accepts only the four managers as an override', () => {
    expect(packageManagerFrom(undefined)).toBeUndefined();
    expect(packageManagerFrom('pnpm')).toBe('pnpm');
    expect(() => packageManagerFrom('cargo')).toThrow(/npm, pnpm, yarn, bun/);
  });
});

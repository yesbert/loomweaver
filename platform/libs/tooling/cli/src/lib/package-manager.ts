import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { ArgError } from './args';

export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';

export const PACKAGE_MANAGERS: readonly PackageManager[] = [
  'npm',
  'pnpm',
  'yarn',
  'bun',
];

export interface DetectedPackageManager {
  readonly manager: PackageManager;
  readonly lockfile?: string;
}

const LOCKFILES: readonly (readonly [string, PackageManager])[] = [
  ['package-lock.json', 'npm'],
  ['npm-shrinkwrap.json', 'npm'],
  ['pnpm-lock.yaml', 'pnpm'],
  ['yarn.lock', 'yarn'],
  ['bun.lock', 'bun'],
  ['bun.lockb', 'bun'],
];

export function detectPackageManager(root: string): DetectedPackageManager {
  for (const [lockfile, manager] of LOCKFILES) {
    if (existsSync(resolve(root, lockfile))) {
      return { manager, lockfile };
    }
  }
  return { manager: 'npm' };
}

export function packageManagerFrom(
  value: string | undefined,
): PackageManager | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!PACKAGE_MANAGERS.includes(value as PackageManager)) {
    throw new ArgError(
      `Option --package-manager must be one of: ${PACKAGE_MANAGERS.join(', ')}.`,
    );
  }
  return value as PackageManager;
}

export function installCommand(
  manager: PackageManager,
  packages: readonly string[],
  dev: boolean,
): string[] {
  const devFlag = manager === 'bun' ? '-d' : '-D';
  const verb = manager === 'npm' ? 'install' : 'add';
  return [manager, verb, ...(dev ? [devFlag] : []), ...packages];
}

export function execCommand(
  manager: PackageManager,
  argv: readonly string[],
): string[] {
  if (manager === 'npm') {
    return ['npx', ...argv];
  }
  if (manager === 'pnpm') {
    return ['pnpm', 'exec', ...argv];
  }
  if (manager === 'bun') {
    return ['bunx', ...argv];
  }
  return ['yarn', ...argv];
}

export function runScriptCommand(
  manager: PackageManager,
  script: string,
): string {
  return `${manager} ${script}`;
}

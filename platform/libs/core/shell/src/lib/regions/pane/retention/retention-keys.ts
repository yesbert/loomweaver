import { containerDockFor } from '../container/container-children';

const PRIMARY_PREFIX = 'primary:';
const PANE_SEPARATOR = ':';
const PART_SEPARATOR = '|';

export function paneRetentionScope(dock: string, paneId: string): string {
  return `${dock}${PANE_SEPARATOR}${paneId}`;
}

export function surfaceRetentionKey(scope: string, path: string): string {
  return `${scope}${PART_SEPARATOR}${path}`;
}

export function viewRetentionKey(
  scope: string,
  path: string,
  instance: string | undefined,
): string {
  return `${surfaceRetentionKey(scope, path)}${PART_SEPARATOR}${instance ?? ''}`;
}

export function primaryRetentionKey(dock: string): string {
  return `${PRIMARY_PREFIX}${dock}`;
}

export function isPrimaryRetentionKey(key: string): boolean {
  return key.startsWith(PRIMARY_PREFIX);
}

export function scopeOfRetentionKey(key: string): string {
  return key.split(PART_SEPARATOR, 1)[0];
}

export function pathOfRetentionKey(key: string): string {
  return key.split(PART_SEPARATOR, 2)[1] ?? '';
}

export function isKeyOfDock(key: string, dock: string): boolean {
  return key.startsWith(`${dock}${PANE_SEPARATOR}`);
}

export function isKeyOfPane(
  key: string,
  dock: string,
  paneId: string,
): boolean {
  return key.startsWith(`${paneRetentionScope(dock, paneId)}${PART_SEPARATOR}`);
}

export function isKeyForSurface(
  key: string,
  scope: string,
  path: string,
): boolean {
  const exact = surfaceRetentionKey(scope, path);
  return key === exact || key.startsWith(`${exact}${PART_SEPARATOR}`);
}

export function containerChildInstances(
  entries: readonly { key: string; instance: unknown }[],
  tabPath: string,
): unknown[] {
  const dock = containerDockFor(tabPath);
  return entries
    .filter((entry) => isKeyOfDock(entry.key, dock))
    .map((entry) => entry.instance);
}

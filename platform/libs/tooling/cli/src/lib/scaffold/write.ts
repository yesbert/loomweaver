import { FileMap } from '@loomweaver/devkit';
import {
  lstatSync,
  mkdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';

export interface WritePlan {
  readonly root: string;
  readonly files: readonly { path: string; absolute: string }[];
  readonly conflicts: readonly string[];
}

export class WriteError extends Error {}

export function planWrite(files: FileMap, root: string): WritePlan {
  const absoluteRoot = resolve(root);
  const planned: { path: string; absolute: string }[] = [];
  const conflicts: string[] = [];
  for (const path of Object.keys(files).toSorted((a, b) => a.localeCompare(b))) {
    const absolute = resolve(absoluteRoot, path);
    const inside = relative(absoluteRoot, absolute);
    if (inside.startsWith('..') || isAbsolute(inside)) {
      throw new WriteError(`Refusing to write outside the target directory: ${path}`);
    }
    planned.push({ path, absolute });
    if (entryExists(absolute)) {
      conflicts.push(path);
    }
  }
  return { root: absoluteRoot, files: planned, conflicts };
}

export function applyWrite(files: FileMap, plan: WritePlan): void {
  for (const file of plan.files) {
    mkdirSync(dirname(file.absolute), { recursive: true });
    assertResolvesInsideRoot(plan.root, file.path, file.absolute);
    replaceSymlinkEntry(file.absolute);
    writeFileSync(file.absolute, files[file.path], 'utf8');
  }
}

function entryExists(absolute: string): boolean {
  try {
    lstatSync(absolute);
    return true;
  } catch {
    return false;
  }
}

function assertResolvesInsideRoot(
  root: string,
  path: string,
  absolute: string,
): void {
  const inside = relative(realpathSync(root), realpathSync(dirname(absolute)));
  if (inside.startsWith('..') || isAbsolute(inside)) {
    throw new WriteError(
      `Refusing to write through a link that leaves the target directory: ${path}`,
    );
  }
}

function replaceSymlinkEntry(absolute: string): void {
  if (entryExists(absolute) && lstatSync(absolute).isSymbolicLink()) {
    rmSync(absolute);
  }
}

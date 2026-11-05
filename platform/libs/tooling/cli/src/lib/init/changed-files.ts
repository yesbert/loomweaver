import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FileMap } from '@loomweaver/devkit';
import { planWrite } from '../scaffold/write';
import { stillAsGenerated } from './generated-files';

export interface Occupied {
  readonly directory: string;
  readonly writer: string;
  readonly preview: string;
  shown(path: string): string;
}

export function refusalToReplace(
  files: FileMap,
  occupied: Occupied,
  trial: boolean,
): string | undefined {
  const root = occupied.directory;
  const changed = planWrite(files, root)
    .conflicts.filter(
      (path) => !stillAsGenerated(path, readFileSync(join(root, path), 'utf8')),
    )
    .map((path) => occupied.shown(path));
  if (changed.length === 0) {
    return undefined;
  }
  const one = changed.length === 1;
  const preview = trial
    ? '.'
    : `; "${occupied.preview}" shows everything it writes.`;
  return (
    `The distribution replaces ${changed.join(', ')}, which ${one ? 'is' : 'are'} not what ${occupied.writer} writes, so nothing was installed or written. ` +
    `Move ${one ? 'it' : 'them'} aside or undo the changes and run init again${preview}`
  );
}

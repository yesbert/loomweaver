import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

/**
 * Every file under `root` whose name `keep` accepts, leaving out any path that runs through a
 * folder named in `skip`. A root that does not exist yields nothing, so the caller decides whether
 * that is an error.
 */
export function filesUnder(root, { keep, skip = [] }) {
  if (!existsSync(root)) return [];
  const skipped = new Set(skip);
  return readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && keep(entry.name))
    .map((entry) => path.join(entry.parentPath, entry.name))
    .filter((file) => path.relative(root, file).split(path.sep).every((part) => !skipped.has(part)))
    .toSorted((a, b) => a.localeCompare(b));
}

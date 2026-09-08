import { existsSync, readdirSync } from 'node:fs';
import { basename, join, relative, sep } from 'node:path';
import { readJsonFile } from './workspace';

export interface NxApplication {
  readonly name: string;
  readonly root: string;
}

const SKIPPED = new Set(['node_modules', 'dist', 'tmp', 'coverage']);

export function nxApplications(
  workspaceRoot: string,
): readonly NxApplication[] {
  const found: NxApplication[] = [];
  const walk = (folder: string): void => {
    const project = join(folder, 'project.json');
    if (existsSync(project)) {
      const config = readJsonFile(project) as Record<string, unknown>;
      const name =
        typeof config['name'] === 'string' ? config['name'] : basename(folder);
      if (config['projectType'] === 'application' && !name.endsWith('-e2e')) {
        found.push({
          name,
          root: relative(workspaceRoot, folder).split(sep).join('/'),
        });
      }
    }
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      if (
        !entry.isDirectory() ||
        SKIPPED.has(entry.name) ||
        entry.name.startsWith('.')
      ) {
        continue;
      }
      walk(join(folder, entry.name));
    }
  };
  walk(workspaceRoot);
  return found.toSorted((a, b) => a.name.localeCompare(b.name));
}

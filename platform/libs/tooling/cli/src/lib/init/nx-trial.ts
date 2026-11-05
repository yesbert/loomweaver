import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  FileMap,
  joinProjectPath,
  nxDistributionFootprint,
  nxWeaverFootprint,
  ScaffoldValues,
} from '@loomweaver/devkit';
import { Application } from './nx-applications';

export interface NxTrial {
  distribution(values: ScaffoldValues): readonly string[];
  weaver(id: string): readonly string[];
}

export function nxTrial(
  workspaceRoot: string,
  app: Application,
  replaced: FileMap | undefined,
): NxTrial {
  const pending = new Map(
    Object.entries(replaced ?? {}).map(([path, content]) => [
      joinProjectPath(app.root, path),
      content,
    ]),
  );
  const onDisk = (path: string) => {
    const file = join(workspaceRoot, path);
    return existsSync(file) ? readFileSync(file, 'utf8') : undefined;
  };
  return {
    distribution: (values) =>
      nxDistributionFootprint(app, values, onDisk).map((path) => {
        if (onDisk(path) === undefined) {
          return `creates ${path}`;
        }
        return pending.has(path) ? `replaces ${path}` : `changes ${path}`;
      }),
    weaver: (id) => {
      const afterDistribution = (path: string) => pending.get(path) ?? onDisk(path);
      return nxWeaverFootprint(app, { id, command: true }, afterDistribution).map(
        (path) =>
          afterDistribution(path) === undefined ? `creates ${path}` : `changes ${path}`,
      );
    },
  };
}

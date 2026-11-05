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

const MANIFEST = 'package.json';

export function nxTrial(
  workspaceRoot: string,
  app: Application,
  replaced: FileMap | undefined,
  installed: readonly string[],
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
  const afterInstall = (path: string) =>
    path === MANIFEST ? withInstalled(onDisk(path), installed) : onDisk(path);
  return {
    distribution: (values) =>
      nxDistributionFootprint(app, values, afterInstall).map((path) => {
        if (onDisk(path) === undefined) {
          return `creates ${path}`;
        }
        return pending.has(path) ? `replaces ${path}` : `changes ${path}`;
      }),
    weaver: (id) => {
      const afterDistribution = (path: string) =>
        pending.get(path) ?? afterInstall(path);
      return nxWeaverFootprint(app, { id, command: true }, afterDistribution).map(
        (path) =>
          afterDistribution(path) === undefined ? `creates ${path}` : `changes ${path}`,
      );
    },
  };
}

function withInstalled(
  manifest: string | undefined,
  installed: readonly string[],
): string | undefined {
  if (manifest === undefined) {
    return undefined;
  }
  const declared = JSON.parse(manifest) as {
    dependencies?: Record<string, string>;
  };
  return JSON.stringify({
    ...declared,
    dependencies: {
      ...declared.dependencies,
      ...Object.fromEntries(installed.map((spec) => [packageName(spec), '*'])),
    },
  });
}

function packageName(spec: string): string {
  const version = spec.lastIndexOf('@');
  return version > 0 ? spec.slice(0, version) : spec;
}

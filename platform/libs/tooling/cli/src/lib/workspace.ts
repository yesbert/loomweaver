import { existsSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import { BuildProject, buildProjects } from './angular-config';

export interface ConfiguredWorkspace {
  readonly root: string;
  readonly kind: 'angular' | 'nx';
  readonly configFile: string;
}

export interface UnconfiguredWorkspace {
  readonly root: string;
  readonly kind?: undefined;
  readonly configFile?: undefined;
}

export type Workspace = ConfiguredWorkspace | UnconfiguredWorkspace;

export class WorkspaceError extends Error {}

export function findWorkspace(from: string): Workspace | undefined {
  let nearestPackage: string | undefined;
  for (const dir of upwardFrom(resolve(from))) {
    const config = buildConfigIn(dir);
    if (config) {
      return { root: dir, ...config };
    }
    if (nearestPackage === undefined && existsSync(resolve(dir, 'package.json'))) {
      nearestPackage = dir;
    }
  }
  return nearestPackage === undefined ? undefined : { root: nearestPackage };
}

function* upwardFrom(start: string): Generator<string> {
  let dir = start;
  for (;;) {
    yield dir;
    const parent = dirname(dir);
    if (parent === dir) {
      return;
    }
    dir = parent;
  }
}

export function resolveBuildProject(
  workspace: Workspace,
  target: string,
): BuildProject {
  const projects = readProjects(workspace);
  if (projects.length === 0) {
    throw new WorkspaceError(
      `No project with a build target found in ${workspace.configFile ?? workspace.root}.`,
    );
  }
  const inside = projects
    .filter((project) => contains(project.root, relativeTo(workspace.root, target)))
    .toSorted((a, b) => b.root.length - a.root.length);
  if (inside.length > 0) {
    return inside[0];
  }
  if (projects.length === 1) {
    return projects[0];
  }
  throw new WorkspaceError(
    `More than one project could be the target, so none was chosen: ${projects
      .map((project) => project.name)
      .join(', ')}. Generate into the project's own directory.`,
  );
}

export function readJsonFile(file: string): unknown {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    throw new WorkspaceError(
      `${file} is not valid JSON: ${(error as Error).message}`,
    );
  }
}

function buildConfigIn(dir: string): Omit<ConfiguredWorkspace, 'root'> | undefined {
  const angular = resolve(dir, 'angular.json');
  if (existsSync(angular)) {
    return { configFile: angular, kind: 'angular' };
  }
  const nx = resolve(dir, 'nx.json');
  if (existsSync(nx)) {
    return { configFile: nx, kind: 'nx' };
  }
  return undefined;
}

function readProjects(workspace: Workspace): readonly BuildProject[] {
  return workspace.kind === 'angular'
    ? buildProjects(readJsonFile(workspace.configFile))
    : [];
}

function contains(projectRoot: string, target: string): boolean {
  return projectRoot === '' || target === projectRoot || target.startsWith(`${projectRoot}/`);
}

function relativeTo(root: string, target: string): string {
  return relative(root, resolve(target)).split(sep).join('/');
}

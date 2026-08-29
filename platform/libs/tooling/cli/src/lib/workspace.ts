import { existsSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';

export interface Workspace {
  readonly root: string;
  readonly configFile?: string;
  readonly kind?: 'angular' | 'nx';
}

export interface BuildProject {
  readonly name: string;
  readonly root: string;
}

export class WorkspaceError extends Error {}

export function findWorkspace(from: string): Workspace | undefined {
  let dir = resolve(from);
  for (;;) {
    if (existsSync(resolve(dir, 'package.json'))) {
      return { root: dir, ...buildConfigIn(dir) };
    }
    const parent = dirname(dir);
    if (parent === dir) {
      return undefined;
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
    .sort((a, b) => b.root.length - a.root.length);
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

function buildConfigIn(dir: string): Partial<Workspace> {
  const angular = resolve(dir, 'angular.json');
  if (existsSync(angular)) {
    return { configFile: angular, kind: 'angular' };
  }
  const nx = resolve(dir, 'nx.json');
  if (existsSync(nx)) {
    return { configFile: nx, kind: 'nx' };
  }
  return {};
}

function readProjects(workspace: Workspace): readonly BuildProject[] {
  if (workspace.kind !== 'angular' || !workspace.configFile) {
    return [];
  }
  const config = readJsonFile(workspace.configFile);
  const projects = asObject(asObject(config)?.['projects']) ?? {};
  return Object.entries(projects)
    .filter(([, project]) => hasBuildTarget(project))
    .map(([name, project]) => ({
      name,
      root: normalise(asObject(project)?.['root']),
    }));
}

function hasBuildTarget(project: unknown): boolean {
  const architect = asObject(project)?.['architect'] ?? asObject(project)?.['targets'];
  return asObject(architect)?.['build'] !== undefined;
}

function contains(projectRoot: string, target: string): boolean {
  return projectRoot === '' || target === projectRoot || target.startsWith(`${projectRoot}/`);
}

function relativeTo(root: string, target: string): string {
  return relative(root, resolve(target)).split(sep).join('/');
}

function withoutTrailingSlashes(path: string): string {
  let end = path.length;
  while (end > 0 && path[end - 1] === '/') {
    end -= 1;
  }
  return path.slice(0, end);
}

function normalise(value: unknown): string {
  return typeof value === 'string'
    ? withoutTrailingSlashes(value.replace(/^\.?\/*/, ''))
    : '';
}

function asObject(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findWorkspace, resolveBuildProject, WorkspaceError } from './workspace';

function angularJson(projects: Record<string, unknown>): string {
  return JSON.stringify({ version: 1, projects });
}

function app(root: string): unknown {
  return { projectType: 'application', root, architect: { build: { options: {} } } };
}

describe('findWorkspace', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'loom-workspace-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('finds the root of a project that sits at it', () => {
    writeFileSync(join(dir, 'package.json'), '{}');
    writeFileSync(join(dir, 'angular.json'), angularJson({}));
    const workspace = findWorkspace(dir);
    expect(workspace?.root).toBe(dir);
    expect(workspace?.kind).toBe('angular');
  });

  it('walks up to the root from a nested project', () => {
    writeFileSync(join(dir, 'package.json'), '{}');
    writeFileSync(join(dir, 'nx.json'), '{}');
    mkdirSync(join(dir, 'apps', 'studio'), { recursive: true });
    const workspace = findWorkspace(join(dir, 'apps', 'studio'));
    expect(workspace?.root).toBe(dir);
    expect(workspace?.kind).toBe('nx');
  });

  it('reports nothing rather than crashing where no workspace is found', () => {
    expect(findWorkspace(join(dir, 'nowhere', 'at', 'all'))).toBeUndefined();
  });
});

describe('resolveBuildProject', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'loom-workspace-'));
    writeFileSync(join(dir, 'package.json'), '{}');
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  function workspaceWith(projects: Record<string, unknown>) {
    writeFileSync(join(dir, 'angular.json'), angularJson(projects));
    const workspace = findWorkspace(dir);
    if (!workspace) {
      throw new Error('the fixture failed to produce a workspace');
    }
    return workspace;
  }

  it('takes the only application when the target names no project', () => {
    const workspace = workspaceWith({ studio: app('') });
    expect(resolveBuildProject(workspace, dir).name).toBe('studio');
  });

  it('takes the project the target sits inside', () => {
    const workspace = workspaceWith({
      studio: app('apps/studio'),
      other: app('apps/other'),
    });
    expect(resolveBuildProject(workspace, join(dir, 'apps', 'other')).name).toBe('other');
  });

  it('names the candidates rather than choosing between them', () => {
    const workspace = workspaceWith({
      studio: app('apps/studio'),
      other: app('apps/other'),
    });
    expect(() => resolveBuildProject(workspace, dir)).toThrow(WorkspaceError);
    expect(() => resolveBuildProject(workspace, dir)).toThrow(/studio, other/);
  });

  it('reports a workspace with no build target instead of guessing', () => {
    const workspace = workspaceWith({ docs: { projectType: 'library', root: 'libs/docs' } });
    expect(() => resolveBuildProject(workspace, dir)).toThrow(/No project with a build target/);
  });
});

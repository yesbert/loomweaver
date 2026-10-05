import { asObject } from '@loomweaver/devkit';
export interface BuildProject {
  readonly name: string;
  readonly root: string;
  readonly prefix?: string;
}

export interface TargetRef {
  readonly value: unknown;
  set(next: unknown): void;
}


export function buildProjects(config: unknown): readonly BuildProject[] {
  const projects = asObject(asObject(config)?.['projects']) ?? {};
  return Object.entries(projects)
    .filter(([, project]) => buildTargetIn(project) !== undefined)
    .map(([name, project]) => ({
      name,
      root: normaliseRoot(asObject(project)?.['root']),
      prefix: declaredPrefix(asObject(project)?.['prefix']),
    }));
}

export function buildTargetOf(config: unknown, project: string): TargetRef | undefined {
  return buildTargetIn(asObject(asObject(config)?.['projects'])?.[project]);
}

function buildTargetIn(project: unknown): TargetRef | undefined {
  for (const key of ['architect', 'targets']) {
    const targets = asObject(asObject(project)?.[key]);
    if (targets?.['build'] !== undefined) {
      return {
        value: targets['build'],
        set: (next) => {
          targets['build'] = next;
        },
      };
    }
  }
  return undefined;
}

function declaredPrefix(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function normaliseRoot(value: unknown): string {
  return typeof value === 'string'
    ? withoutTrailingSlashes(value.replace(/^\.?\/*/, ''))
    : '';
}

function withoutTrailingSlashes(path: string): string {
  let end = path.length;
  while (end > 0 && path[end - 1] === '/') {
    end -= 1;
  }
  return path.slice(0, end);
}

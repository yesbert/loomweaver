export interface BuildProject {
  readonly name: string;
  readonly root: string;
  readonly prefix?: string;
}

export interface TargetRef {
  readonly value: unknown;
  set(next: unknown): void;
}

export function asObject(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
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

export function entryStylesheetOf(target: unknown): string | undefined {
  const styles = asObject(asObject(target)?.['options'])?.['styles'];
  if (!Array.isArray(styles)) {
    return undefined;
  }
  return styles
    .map((style) => (typeof style === 'string' ? style : asObject(style)?.['input']))
    .find(
      (input): input is string => typeof input === 'string' && input.endsWith('.css'),
    );
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

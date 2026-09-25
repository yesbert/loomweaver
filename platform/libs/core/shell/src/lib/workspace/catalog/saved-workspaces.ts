export const WORKSPACES_KEY = 'lw.shell.workspaces';

export interface Workspace {
  readonly id: string;
  readonly name: string;
  readonly baseline: Readonly<Record<string, string>>;
  readonly origin?: string;
}

export function parseWorkspaces(raw: string | undefined): Workspace[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (workspace): workspace is Workspace =>
        !!workspace &&
        typeof (workspace as Workspace).id === 'string' &&
        typeof (workspace as Workspace).name === 'string' &&
        typeof (workspace as Workspace).baseline === 'object' &&
        (workspace as Workspace).baseline !== null &&
        !Array.isArray((workspace as Workspace).baseline),
    );
  } catch {
    return [];
  }
}

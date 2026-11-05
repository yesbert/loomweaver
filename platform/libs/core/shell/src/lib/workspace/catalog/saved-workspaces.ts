import { parseStored } from '../../persistence/stored-values/parse-stored';
export const WORKSPACES_KEY = 'lw.shell.workspaces';

export interface Workspace {
  readonly id: string;
  readonly name: string;
  readonly baseline: Readonly<Record<string, string>>;
  readonly origin?: string;
}

export interface ReadWorkspaces {
  readonly workspaces: Workspace[];
  readonly malformed: boolean;
}

export function readWorkspaces(raw: string | undefined): ReadWorkspaces {
  if (!raw) {
    return { workspaces: [], malformed: false };
  }
  const parsed = parseStored(raw);
  if (!Array.isArray(parsed)) {
    return { workspaces: [], malformed: true };
  }
  const workspaces = parsed.filter(
      (workspace): workspace is Workspace =>
        !!workspace &&
        typeof (workspace as Workspace).id === 'string' &&
        typeof (workspace as Workspace).name === 'string' &&
        typeof (workspace as Workspace).baseline === 'object' &&
        (workspace as Workspace).baseline !== null &&
        !Array.isArray((workspace as Workspace).baseline),
  );
  return { workspaces, malformed: workspaces.length !== parsed.length };
}

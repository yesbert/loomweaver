export interface ParsedArgs {
  readonly command: string;
  readonly flags: Readonly<Record<string, string | boolean>>;
}

export class ArgError extends Error {}

function assign(
  flags: Record<string, string | boolean>,
  token: string,
  next: string | undefined,
): boolean {
  const body = token.slice(2);
  const eq = body.indexOf('=');
  if (eq !== -1) {
    flags[body.slice(0, eq)] = body.slice(eq + 1);
    return false;
  }
  if (body.startsWith('no-')) {
    flags[body.slice(3)] = false;
    return false;
  }
  if (next === undefined || next.startsWith('-')) {
    flags[body] = true;
    return false;
  }
  flags[body] = next;
  return true;
}

export function parseArgs(argv: readonly string[]): ParsedArgs {
  const flags: Record<string, string | boolean> = {};
  let command = '';
  for (let index = 0; index < argv.length; index++) {
    const token = argv[index];
    if (token === '-h' || token === '--help') {
      flags['help'] = true;
      continue;
    }
    if (token === '-v' || token === '--version') {
      flags['version'] = true;
      continue;
    }
    if (token.startsWith('--')) {
      if (assign(flags, token, argv[index + 1])) {
        index++;
      }
      continue;
    }
    if (token.startsWith('-')) {
      throw new ArgError(`Unknown option "${token}".`);
    }
    if (command) {
      throw new ArgError(`Unexpected argument "${token}" after "${command}".`);
    }
    command = token;
  }
  return { command, flags };
}

export function rejectUnknownFlags(
  args: ParsedArgs,
  allowed: Iterable<string>,
): void {
  const known = new Set(['help', 'version', ...allowed]);
  const unknown = Object.keys(args.flags).filter((name) => !known.has(name));
  if (unknown.length > 0) {
    throw new ArgError(
      `Unknown option${unknown.length > 1 ? 's' : ''} ${unknown
        .map((name) => `"--${name}"`)
        .join(', ')}. Run "loomweaver list" to see every option.`,
    );
  }
}

export function stringFlag(
  args: ParsedArgs,
  name: string,
): string | undefined {
  const value = args.flags[name];
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new ArgError(`Option --${name} needs a value.`);
  }
  return value;
}

export function requiredFlag(args: ParsedArgs, name: string): string {
  const value = stringFlag(args, name);
  if (!value) {
    throw new ArgError(`Option --${name} is required.`);
  }
  return value;
}

export function boolFlag(args: ParsedArgs, name: string): boolean | undefined {
  const value = args.flags[name];
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== 'boolean') {
    throw new ArgError(`Option --${name} does not take a value.`);
  }
  return value;
}

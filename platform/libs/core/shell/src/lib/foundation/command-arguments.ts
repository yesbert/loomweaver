import {
  CommandAnswer,
  CommandArgument,
  CommandArguments,
  CommandScalar,
} from '@loomweaver/plugin-sdk';

const MAX_ANSWER_DEPTH = 8;

export function checkArguments(
  declared: readonly CommandArgument[] | undefined,
  args: unknown,
): string | null {
  if (args !== undefined && !isPlainObject(args)) {
    return 'takes its arguments as an object keyed by argument name';
  }
  const argument = declared ?? [];
  const supplied: Record<string, unknown> = args ?? {};
  const known = new Set(argument.map((entry) => entry.name));
  for (const name of Object.keys(supplied)) {
    if (!known.has(name)) {
      return `does not declare an argument named "${name}"`;
    }
  }
  for (const entry of argument) {
    const value = supplied[entry.name];
    if (value === undefined) {
      if (entry.required === true) {
        return `requires the argument "${entry.name}"`;
      }
      continue;
    }
    const problem = checkValue(entry, value);
    if (problem !== null) {
      return problem;
    }
  }
  return null;
}

export function asCommandArguments(value: unknown): CommandArguments | null {
  if (!isPlainObject(value)) {
    return null;
  }
  const carried: Record<string, CommandScalar | readonly CommandScalar[]> = {};
  for (const [name, entry] of Object.entries(value)) {
    if (isScalar(entry)) {
      carried[name] = entry;
      continue;
    }
    if (Array.isArray(entry) && entry.every(isScalar)) {
      carried[name] = entry;
      continue;
    }
    return null;
  }
  return carried;
}

export function isCommandAnswer(
  value: unknown,
  depth = 0,
): value is CommandAnswer {
  if (depth > MAX_ANSWER_DEPTH) {
    return false;
  }
  if (value === null || isScalar(value)) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.every((entry) => isCommandAnswer(entry, depth + 1));
  }
  if (!isPlainObject(value)) {
    return false;
  }
  return Object.values(value).every((entry) =>
    isCommandAnswer(entry, depth + 1),
  );
}

function checkValue(entry: CommandArgument, value: unknown): string | null {
  if (entry.list === true) {
    if (!Array.isArray(value)) {
      return `expects a list for "${entry.name}"`;
    }
    for (const item of value) {
      const problem = checkScalar(entry, item);
      if (problem !== null) {
        return problem;
      }
    }
    return null;
  }
  if (Array.isArray(value)) {
    return `expects a single value for "${entry.name}", not a list`;
  }
  return checkScalar(entry, value);
}

function checkScalar(entry: CommandArgument, value: unknown): string | null {
  if (entry.kind === 'choice') {
    return typeof value === 'string' && entry.choices.includes(value)
      ? null
      : `expects "${entry.name}" to be one of ${entry.choices.join(', ')}`;
  }
  if (entry.kind === 'number') {
    return typeof value === 'number' && Number.isFinite(value)
      ? null
      : `expects "${entry.name}" to be a finite number`;
  }
  const expected = entry.kind === 'text' ? 'string' : 'boolean';
  return typeof value === expected
    ? null
    : `expects "${entry.name}" to be a ${entry.kind}`;
}

function isScalar(value: unknown): value is CommandScalar {
  return (
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

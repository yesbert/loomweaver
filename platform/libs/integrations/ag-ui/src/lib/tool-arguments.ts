import type { CommandArguments, CommandScalar } from '@loomweaver/plugin-sdk';

/**
 * Reads the JSON an agent streamed for one call into arguments the workbench can be handed, or
 * `null` where it cannot be read as such.
 *
 * This checks only that the values can *cross*, not that they are the ones the command declared.
 * That second check belongs to the workbench and happens there, so a call that survives this one may
 * still be refused for naming an argument the command does not take.
 *
 * An empty stream of deltas reads as a call with no arguments, which is what an agent sends for a
 * command that declares none.
 */
export function readArguments(json: string): CommandArguments | null {
  const text = json.trim();
  if (text.length === 0) {
    return {};
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isRecord(parsed)) {
    return null;
  }
  const args: Record<string, CommandScalar | readonly CommandScalar[]> = {};
  for (const [name, value] of Object.entries(parsed)) {
    if (isScalar(value)) {
      args[name] = value;
      continue;
    }
    if (Array.isArray(value) && value.every(isScalar)) {
      args[name] = value;
      continue;
    }
    return null;
  }
  return args;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isScalar(value: unknown): value is CommandScalar {
  return (
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  );
}

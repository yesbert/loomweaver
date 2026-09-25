import {
  kebabCase,
  portableOptions,
  ScaffoldDescriptor,
  ScaffoldOption,
  ScaffoldValues,
  findScaffold as findDescriptor,
} from '@loomweaver/devkit';
import { relative, resolve } from 'node:path';
import { ArgError, boolFlag, ParsedArgs, stringFlag } from '../args';
import { findWorkspace } from '../workspace';

export { SCAFFOLDS, type ScaffoldDescriptor } from '@loomweaver/devkit';

export function findScaffold(name: string): ScaffoldDescriptor {
  const scaffold = findDescriptor(name);
  if (!scaffold) {
    throw new ArgError(
      `Unknown command "${name}". Run "loomweaver list" to see what is available.`,
    );
  }
  return scaffold;
}

export function allowedFlagsFor(scaffold: ScaffoldDescriptor): string[] {
  return portableOptions(scaffold).flatMap((option) => [
    option.name,
    kebabCase(option.name),
  ]);
}

function readFlag(
  args: ParsedArgs,
  option: ScaffoldOption,
): string | boolean | undefined {
  const kebab = kebabCase(option.name);
  const spelled: ParsedArgs = {
    ...args,
    flags: { ...args.flags, [kebab]: args.flags[kebab] ?? args.flags[option.name] },
  };
  return option.type === 'string'
    ? stringFlag(spelled, kebab)
    : boolFlag(spelled, kebab);
}

function valuesFor(
  scaffold: ScaffoldDescriptor,
  args: ParsedArgs,
): ScaffoldValues {
  const values: Record<string, string | boolean | undefined> = {};
  for (const option of portableOptions(scaffold)) {
    const value = readFlag(args, option);
    if (value === undefined) {
      if (option.required) {
        throw new ArgError(`Option --${kebabCase(option.name)} is required.`);
      }
      continue;
    }
    if (option.choices && !option.choices.includes(String(value))) {
      throw new ArgError(
        `Option --${kebabCase(option.name)} must be one of: ${option.choices.join(', ')}.`,
      );
    }
    values[option.name] = value;
  }
  return values;
}

function directoryFromOut(out: string | undefined): string {
  const target = resolve(out ?? '.');
  const base = findWorkspace(target)?.root ?? process.cwd();
  const below = relative(base, target);
  if (below.startsWith('..')) {
    return '';
  }
  return below || '.';
}

export function scaffoldValues(
  scaffold: ScaffoldDescriptor,
  args: ParsedArgs,
): ScaffoldValues {
  const values = valuesFor(scaffold, args);
  const takesDirectory = scaffold.options.some(
    (option) => option.name === 'directory',
  );
  if (!takesDirectory) {
    return values;
  }
  const out = args.flags['out'];
  return {
    ...values,
    directory: directoryFromOut(typeof out === 'string' ? out : undefined),
  };
}


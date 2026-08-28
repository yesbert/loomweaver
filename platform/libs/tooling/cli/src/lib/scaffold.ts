import {
  FileMap,
  kebabCase,
  portableOptions,
  ScaffoldDescriptor,
  ScaffoldOption,
  ScaffoldValues,
  SCAFFOLDS,
  findScaffold as findDescriptor,
} from '@loomweaver/devkit';
import { relative, resolve } from 'node:path';
import { ArgError, ParsedArgs } from './args';

export { SCAFFOLDS };
export type { ScaffoldDescriptor };

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
  const value = args.flags[kebab] ?? args.flags[option.name];
  if (value === undefined) {
    return undefined;
  }
  if (option.type === 'string' && typeof value !== 'string') {
    throw new ArgError(`Option --${kebab} needs a value.`);
  }
  if (option.type === 'boolean' && typeof value !== 'boolean') {
    throw new ArgError(`Option --${kebab} does not take a value.`);
  }
  return value;
}

export function valuesFor(
  scaffold: ScaffoldDescriptor,
  args: ParsedArgs,
): ScaffoldValues {
  const values: Record<string, string | boolean | undefined> = {};
  for (const option of portableOptions(scaffold)) {
    const value = readFlag(args, option);
    if (value === undefined) {
      if (option.required) {
        throw new ArgError(
          `Option --${kebabCase(option.name)} is required.`,
        );
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
  const below = relative(process.cwd(), resolve(out ?? '.'));
  return below.startsWith('..') ? '' : below;
}

export function buildScaffold(
  scaffold: ScaffoldDescriptor,
  args: ParsedArgs,
): FileMap {
  const values = valuesFor(scaffold, args);
  const takesDirectory = scaffold.options.some(
    (option) => option.name === 'directory',
  );
  const out = args.flags['out'];
  return scaffold.build(
    takesDirectory
      ? {
          ...values,
          directory: directoryFromOut(
            typeof out === 'string' ? out : undefined,
          ),
        }
      : values,
  );
}

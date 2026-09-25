import {
  type CommandSource,
  I18nBundle,
  loadTypeScript,
  validateCatalog,
  validateCommands,
  validateI18nParity,
  validateManifest,
} from '@loomweaver/devkit';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ArgError,
  boolFlag,
  ParsedArgs,
  rejectUnknownFlags,
  requiredFlag,
  stringFlag,
} from '../args';
import { Io } from '../io';

function reportFindings(
  io: Io,
  findings: readonly { level: string; message: string }[],
  strict: boolean,
): number {
  if (findings.length === 0) {
    io.out('No findings.');
    return 0;
  }
  for (const f of findings) {
    (f.level === 'info' ? io.out : io.err)(`${f.level}: ${f.message}`);
  }
  const gating = findings.filter((f) => f.level !== 'info');
  if (gating.some((f) => f.level === 'error')) {
    return 1;
  }
  return strict && gating.length > 0 ? 1 : 0;
}

export function validateManifestCommand(args: ParsedArgs, io: Io): number {
  rejectUnknownFlags(args, ['id', 'name', 'capabilities', 'strict']);
  const capabilities = (stringFlag(args, 'capabilities') ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  return reportFindings(
    io,
    validateManifest({
      id: requiredFlag(args, 'id'),
      name: stringFlag(args, 'name'),
      capabilities,
    }),
    boolFlag(args, 'strict') === true,
  );
}

function readBundles(dir: string): Record<string, I18nBundle> {
  const bundles: Record<string, I18nBundle> = {};
  for (const entry of readdirSync(dir)) {
    if (!entry.endsWith('.json')) {
      continue;
    }
    const language = entry.slice(0, -'.json'.length);
    try {
      bundles[language] = JSON.parse(readFileSync(join(dir, entry), 'utf8'));
    } catch (error) {
      throw new ArgError(
        `${entry} is not valid JSON: ${(error as Error).message}`,
      );
    }
  }
  if (Object.keys(bundles).length === 0) {
    throw new ArgError(`No <lang>.json bundles found in ${dir}.`);
  }
  return bundles;
}

export function validateI18nCommand(args: ParsedArgs, io: Io): number {
  rejectUnknownFlags(args, ['dir', 'strict']);
  return reportFindings(
    io,
    validateI18nParity(readBundles(requiredFlag(args, 'dir'))),
    boolFlag(args, 'strict') === true,
  );
}

function readSources(dir: string): CommandSource[] {
  const sources: CommandSource[] = [];
  const walk = (folder: string): void => {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      if (
        entry.name === 'node_modules' ||
        entry.name === 'dist' ||
        entry.name.startsWith('.')
      ) {
        continue;
      }
      const path = join(folder, entry.name);
      if (entry.isDirectory()) {
        walk(path);
      } else if (
        entry.name.endsWith('.ts') &&
        !entry.name.endsWith('.d.ts') &&
        !entry.name.endsWith('.spec.ts')
      ) {
        sources.push({ path, text: readFileSync(path, 'utf8') });
      }
    }
  };
  try {
    walk(dir);
  } catch (error) {
    throw new ArgError(`Cannot read ${dir}: ${(error as Error).message}`);
  }
  if (sources.length === 0) {
    throw new ArgError(`No TypeScript sources found under ${dir}.`);
  }
  return sources;
}

export function validateCommandsCommand(args: ParsedArgs, io: Io): number {
  rejectUnknownFlags(args, ['dir', 'strict']);
  const dir = requiredFlag(args, 'dir');
  const ts = loadTypeScript(dir);
  if (!ts) {
    throw new ArgError(
      `typescript is not installed where ${dir} can reach it; the check reads sources with the TypeScript compiler API, so run it inside the project.`,
    );
  }
  return reportFindings(
    io,
    validateCommands(readSources(dir), ts),
    boolFlag(args, 'strict') === true,
  );
}

function readCatalog(file: string): unknown {
  let raw: string;
  try {
    raw = readFileSync(file, 'utf8');
  } catch (error) {
    throw new ArgError(`Cannot read ${file}: ${(error as Error).message}`);
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new ArgError(
      `${file} is not valid JSON: ${(error as Error).message}`,
    );
  }
}

export function validateCatalogCommand(args: ParsedArgs, io: Io): number {
  rejectUnknownFlags(args, ['file', 'strict']);
  return reportFindings(
    io,
    validateCatalog(readCatalog(requiredFlag(args, 'file'))),
    boolFlag(args, 'strict') === true,
  );
}

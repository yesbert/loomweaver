import {
  I18nBundle,
  kebabCase,
  portableOptions,
  usageFor,
  validateCatalog,
  validateI18nParity,
  validateManifest,
} from '@loomweaver/devkit';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ArgError,
  boolFlag,
  parseArgs,
  ParsedArgs,
  rejectUnknownFlags,
  requiredFlag,
  stringFlag,
} from './args';
import { AmendPlan, applyAmend, planAmend } from './amend';
import {
  allowedFlagsFor,
  amendmentsFor,
  buildScaffold,
  findScaffold,
  SCAFFOLDS,
} from './scaffold';
import { applyWrite, planWrite } from './write';

export interface Io {
  out(line: string): void;
  err(line: string): void;
}

const VERSION = process.env['LOOM_CLI_VERSION'] ?? '0.0.0';

function help(): string {
  const commands = SCAFFOLDS.map((s) => `  ${s.name.padEnd(16)}${s.summary}`);
  return [
    'loomweaver — LoomWeaver scaffolding',
    '',
    'Usage: loomweaver <command> [options]',
    '',
    'Scaffolds:',
    ...commands,
    '',
    'Other commands:',
    '  list            print every scaffold with its options',
    '  validate-manifest --id <id> [--name <name>] [--capabilities <a,b>]',
    '  validate-i18n   --dir <dir>   check <lang>.json bundles for key parity',
    '  validate-catalog --file <path> check a plugin store catalog the host parses defensively',
    '',
    'Options:',
    '  --out <dir>     where to write (default: the current directory)',
    '  --dry-run       list the files without writing them',
    '  --force         overwrite files that already exist',
    '  --strict        make validation warnings fail the exit code (for CI)',
    '  -h, --help      this text',
    '  -v, --version   the version, which matches the platform packages',
  ].join('\n');
}

function list(args: ParsedArgs, io: Io): number {
  rejectUnknownFlags(args, []);
  for (const scaffold of SCAFFOLDS) {
    io.out(`${scaffold.name}`);
    io.out(`  ${scaffold.summary}`);
    io.out(`  loomweaver ${usageFor(scaffold)}`);
    for (const option of portableOptions(scaffold)) {
      const flag = `--${kebabCase(option.name)}`;
      io.out(`    ${flag.padEnd(18)}${option.description}`);
    }
    io.out('');
  }
  return 0;
}

function reportFindings(
  io: Io,
  findings: readonly { level: string; message: string }[],
  strict: boolean,
): number {
  if (findings.length === 0) {
    io.out('No findings.');
    return 0;
  }
  for (const f of findings) io.err(`${f.level}: ${f.message}`);
  if (findings.some((f) => f.level === 'error')) {
    return 1;
  }
  return strict ? 1 : 0;
}

function validateManifestCommand(args: ParsedArgs, io: Io): number {
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
      throw new ArgError(`${entry} is not valid JSON: ${(error as Error).message}`);
    }
  }
  if (Object.keys(bundles).length === 0) {
    throw new ArgError(`No <lang>.json bundles found in ${dir}.`);
  }
  return bundles;
}

function validateI18nCommand(args: ParsedArgs, io: Io): number {
  rejectUnknownFlags(args, ['dir', 'strict']);
  return reportFindings(
    io,
    validateI18nParity(readBundles(requiredFlag(args, 'dir'))),
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
    throw new ArgError(`${file} is not valid JSON: ${(error as Error).message}`);
  }
}

function validateCatalogCommand(args: ParsedArgs, io: Io): number {
  rejectUnknownFlags(args, ['file', 'strict']);
  return reportFindings(
    io,
    validateCatalog(readCatalog(requiredFlag(args, 'file'))),
    boolFlag(args, 'strict') === true,
  );
}

function reportAmendments(io: Io, amend: AmendPlan, done: boolean): void {
  if (amend.amendments.length > 0) {
    io.out(
      done
        ? `Wired ${amend.amendments.length} workspace file(s):`
        : `Would wire ${amend.amendments.length} workspace file(s):`,
    );
    for (const amendment of amend.amendments) {
      io.out(`  ${amendment.display}`);
      for (const entry of amendment.added) {
        io.out(`    + ${entry}`);
      }
    }
  }
  if (amend.remaining.length > 0) {
    io.out('Still to do by hand:');
    for (const entry of amend.remaining) {
      io.out(`  - ${entry}`);
    }
  }
}

function scaffold(args: ParsedArgs, io: Io): number {
  const descriptor = findScaffold(args.command);
  rejectUnknownFlags(args, [
    ...allowedFlagsFor(descriptor),
    'out',
    'dry-run',
    'force',
  ]);
  const files = buildScaffold(descriptor, args);
  const out = stringFlag(args, 'out') ?? '.';
  const plan = planWrite(files, out);
  const paths = plan.files.map((file) => file.path);
  const amend = planAmend(amendmentsFor(descriptor, args), out);

  if (boolFlag(args, 'dry-run')) {
    io.out(`Would write ${paths.length} file(s) into ${plan.root}:`);
    for (const path of paths) {
      io.out(`  ${path}`);
    }
    if (plan.conflicts.length > 0) {
      io.out(
        `${plan.conflicts.length} of them already exist and would need --force:`,
      );
      for (const path of plan.conflicts) {
        io.out(`  ${path}`);
      }
    }
    reportAmendments(io, amend, false);
    return 0;
  }

  if (plan.conflicts.length > 0 && !boolFlag(args, 'force')) {
    io.err(
      `${plan.conflicts.length} file(s) already exist; pass --force to overwrite:`,
    );
    for (const path of plan.conflicts) {
      io.err(`  ${path}`);
    }
    return 1;
  }

  applyWrite(files, plan);
  applyAmend(amend);
  io.out(`Wrote ${paths.length} file(s) into ${plan.root}:`);
  for (const path of paths) {
    io.out(`  ${path}`);
  }
  reportAmendments(io, amend, true);
  return 0;
}

export function run(argv: readonly string[], io: Io): number {
  let args: ParsedArgs;
  try {
    args = parseArgs(argv);
  } catch (error) {
    io.err((error as Error).message);
    return 1;
  }

  if (args.flags['version']) {
    io.out(VERSION);
    return 0;
  }
  if (args.flags['help']) {
    io.out(help());
    return 0;
  }
  if (!args.command) {
    io.out(help());
    return 1;
  }

  try {
    if (args.command === 'list') {
      return list(args, io);
    }
    if (args.command === 'validate-manifest') {
      return validateManifestCommand(args, io);
    }
    if (args.command === 'validate-i18n') {
      return validateI18nCommand(args, io);
    }
    if (args.command === 'validate-catalog') {
      return validateCatalogCommand(args, io);
    }
    return scaffold(args, io);
  } catch (error) {
    io.err((error as Error).message);
    return 1;
  }
}

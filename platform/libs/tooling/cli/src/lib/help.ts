import { kebabCase, portableOptions, usageFor } from '@loomweaver/devkit';
import { ParsedArgs, rejectUnknownFlags } from './args';
import { Io } from './io';
import { SCAFFOLDS } from './scaffold/scaffold';

export function help(): string {
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
    '  init            take the Angular application or Nx workspace you are in to a running product:',
    '                  install the platform, scaffold the distribution and a first weaver, say what to serve',
    '                  [--title <t>] [--styles tailwind|precompiled] [--weaver <id>|--no-weaver] [--app <nx app>]',
    '                  [--package-manager npm|pnpm|yarn|bun] [--dry-run]',
    '  list            print every scaffold with its options',
    '  validate-manifest --id <id> [--name <name>] [--capabilities <a,b>]',
    '  validate-i18n   --dir <dir>   check <lang>.json bundles for key parity',
    '  validate-catalog --file <path> check a plugin store catalog the host parses defensively',
    '  validate-commands --dir <dir> say, per command, whether an agent is offered it and what it would guess at',
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

export function list(args: ParsedArgs, io: Io): number {
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

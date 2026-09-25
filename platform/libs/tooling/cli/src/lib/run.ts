import { parseArgs, ParsedArgs } from './args';
import { execInherit } from './exec';
import { help, list } from './help';
import { init } from './init';
import { InitDeps, UNBUNDLED_VERSION } from './init-plan';
import { Io } from './io';
import { scaffold } from './scaffold-command';
import {
  validateCatalogCommand,
  validateCommandsCommand,
  validateI18nCommand,
  validateManifestCommand,
} from './validate-command';

type CommandHandler = (args: ParsedArgs, io: Io, deps: InitDeps) => number;

const VERSION = process.env['LOOM_CLI_VERSION'] ?? UNBUNDLED_VERSION;

const COMMANDS = new Map<string, CommandHandler>([
  ['init', init],
  ['list', list],
  ['validate-manifest', validateManifestCommand],
  ['validate-i18n', validateI18nCommand],
  ['validate-catalog', validateCatalogCommand],
  ['validate-commands', validateCommandsCommand],
]);

export function run(
  argv: readonly string[],
  io: Io,
  deps?: Partial<InitDeps>,
): number {
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

  const command = COMMANDS.get(args.command) ?? scaffold;
  try {
    return command(args, io, {
      cwd: deps?.cwd ?? process.cwd(),
      exec: deps?.exec ?? execInherit,
      run: deps?.run ?? ((inner) => run(inner, io, deps)),
      version: deps?.version ?? VERSION,
    });
  } catch (error) {
    io.err((error as Error).message);
    return 1;
  }
}

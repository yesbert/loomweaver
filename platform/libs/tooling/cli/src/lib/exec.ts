import { spawnSync } from 'node:child_process';

class ExecError extends Error {}

const PLAIN_ARGUMENT = /^[\w@./:=+-]+$/;
const READ_BY_THE_SHELL = /["%\r\n]/;

export function execInherit(command: readonly string[], cwd: string): void {
  const result =
    process.platform === 'win32'
      ? spawnSync(windowsCommandLine(command), {
          cwd,
          stdio: 'inherit',
          shell: true,
        })
      : spawnSync(command[0], command.slice(1), { cwd, stdio: 'inherit' });
  if (result.error) {
    throw new ExecError(
      `Could not run "${command.join(' ')}": ${result.error.message}`,
    );
  }
  if (result.status !== 0) {
    throw new ExecError(
      `"${command.join(' ')}" exited with ${result.status ?? 'a signal'}.`,
    );
  }
}

export function windowsCommandLine(command: readonly string[]): string {
  return command.map((argument) => windowsArgument(argument)).join(' ');
}

function windowsArgument(argument: string): string {
  if (READ_BY_THE_SHELL.test(argument)) {
    throw new ExecError(
      `${JSON.stringify(argument)} holds a quote, a percent sign or a line break, which the Windows command shell reads as its own, so nothing was run. Leave those characters out.`,
    );
  }
  if (PLAIN_ARGUMENT.test(argument)) {
    return argument;
  }
  let end = argument.length;
  while (end > 0 && argument[end - 1] === '\\') {
    end -= 1;
  }
  return `"${argument}${argument.slice(end)}"`;
}

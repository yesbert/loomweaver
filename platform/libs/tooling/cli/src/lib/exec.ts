import { spawnSync } from 'node:child_process';

class ExecError extends Error {}

export function execInherit(command: readonly string[], cwd: string): void {
  const result = spawnSync(command[0], command.slice(1), {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
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

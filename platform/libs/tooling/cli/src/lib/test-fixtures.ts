import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Io } from './io';

export interface CapturedIo {
  readonly io: Io;
  text(): string;
  errText(): string;
}

export function capture(): CapturedIo {
  const out: string[] = [];
  const err: string[] = [];
  return {
    io: {
      out: (line: string) => void out.push(line),
      err: (line: string) => void err.push(line),
    },
    text: () => out.join('\n'),
    errText: () => err.join('\n'),
  };
}

export function writeFiles(root: string, files: Record<string, string>): void {
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(join(root, path, '..'), { recursive: true });
    writeFileSync(join(root, path), content, 'utf8');
  }
}

export function inDirectory<T>(directory: string, act: () => T): T {
  const cwd = process.cwd();
  try {
    process.chdir(directory);
    return act();
  } finally {
    process.chdir(cwd);
  }
}

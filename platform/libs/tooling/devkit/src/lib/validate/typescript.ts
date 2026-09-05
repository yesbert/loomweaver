import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import type * as TS from 'typescript';

/** The TypeScript compiler API, as the command check needs it. */
export type TypeScriptModule = typeof TS;

/**
 * Resolves the TypeScript compiler the way a project's own tooling would: from the directory being
 * checked first, then from the working directory. Returns null where neither has it, so the caller
 * can say so instead of failing inside the compiler.
 */
export function loadTypeScript(fromDir: string): TypeScriptModule | null {
  for (const from of [resolve(fromDir, 'package.json'), resolve(process.cwd(), 'package.json')]) {
    try {
      return createRequire(from)('typescript') as TypeScriptModule;
    } catch {
      continue;
    }
  }
  return null;
}

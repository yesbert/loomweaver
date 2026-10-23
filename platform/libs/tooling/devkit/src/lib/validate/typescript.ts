import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import type * as TS from 'typescript';

/** The TypeScript compiler API, as the command check needs it. */
export type TypeScriptModule = typeof TS;

/**
 * The package Microsoft publishes with the TypeScript 6.0 compiler API, for tools that read sources
 * where the project itself is on TypeScript 7, whose `typescript` package no longer carries that API.
 */
export const TYPESCRIPT_COMPATIBILITY_PACKAGE = '@typescript/typescript6';

/**
 * What the lookup found: a compiler the check can read sources with, or `ts: null` and, where a
 * TypeScript was installed but offers no compiler API, the version it found.
 */
export type TypeScriptLookup =
  | { readonly ts: TypeScriptModule }
  | { readonly ts: null; readonly withoutInterface?: string };

/**
 * Resolves the TypeScript compiler the way a project's own tooling would: from the directory being
 * checked first, then from `alsoFrom`, the working directory unless given. A TypeScript that cannot
 * read a source file, such as TypeScript 7, is passed over for {@link TYPESCRIPT_COMPATIBILITY_PACKAGE}
 * installed beside it. Where neither is found the result says why, so the caller can say so instead
 * of failing inside the compiler.
 */
export function loadTypeScript(fromDir: string, alsoFrom: string = process.cwd()): TypeScriptLookup {
  let withoutInterface: string | undefined;
  for (const from of [resolve(fromDir, 'package.json'), resolve(alsoFrom, 'package.json')]) {
    const found = requireFrom(from, 'typescript');
    if (readsSources(found)) {
      return { ts: found };
    }
    if (!found) {
      continue;
    }
    withoutInterface ??= versionOf(found);
    const compatible = requireFrom(from, TYPESCRIPT_COMPATIBILITY_PACKAGE);
    if (readsSources(compatible)) {
      return { ts: compatible };
    }
  }
  return withoutInterface === undefined ? { ts: null } : { ts: null, withoutInterface };
}

function requireFrom(from: string, name: string): unknown {
  try {
    return createRequire(from)(name);
  } catch {
    return undefined;
  }
}

function readsSources(found: unknown): found is TypeScriptModule {
  return typeof (found as Partial<TypeScriptModule> | undefined)?.createSourceFile === 'function';
}

function versionOf(found: unknown): string {
  const version = (found as { version?: unknown }).version;
  return typeof version === 'string' ? version : 'unknown';
}

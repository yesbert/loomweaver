import { posix } from 'node:path';

export interface StylesheetImportResult {
  readonly css: string;
  /** False where the import it should follow was not found, so it went after the last import instead. */
  readonly anchored: boolean;
}

const IMPORT = /^\s*@import\s+(?:url\(\s*)?['"]([^'"]+)['"]/;

function specifierOf(line: string): string | undefined {
  return IMPORT.exec(line)?.[1];
}

/** The specifier the entry stylesheet imports a workspace-relative file under. */
export function importSpecifier(entryStylesheet: string, file: string): string {
  const path = posix.relative(posix.dirname(entryStylesheet), file);
  return path.startsWith('..') ? path : `./${path}`;
}

/**
 * Ensures the stylesheet imports `specifier`, directly after the last import whose specifier starts
 * with `after`. Where no such import exists, the line goes after the last import of any kind, never
 * after a rule, because an import below a rule is ignored.
 */
export function ensureStylesheetImport(
  css: string,
  specifier: string,
  after: string,
): StylesheetImportResult {
  const lines = css.split('\n');
  if (lines.some((line) => specifierOf(line) === specifier)) {
    return { css, anchored: true };
  }
  const anchor = lines.findLastIndex(
    (line) => specifierOf(line)?.startsWith(after) === true,
  );
  const position =
    anchor === -1
      ? lines.findLastIndex((line) => specifierOf(line) !== undefined)
      : anchor;
  lines.splice(position + 1, 0, `@import '${specifier}';`);
  return { css: lines.join('\n'), anchored: anchor !== -1 };
}

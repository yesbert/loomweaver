import { ComposePluginAmendment } from './types';

export interface ComposeResult {
  readonly source: string;
  readonly composed: boolean;
}

const PROVIDERS = /(export\s+const\s+appConfig\s*:[^=]*=\s*\{[\s\S]*?providers\s*:\s*\[)([\s\S]*?)(\n(\s*)\],)/;
const SHELL_IMPORT = /import\s*\{([^}]*)\}\s*from\s*'@loomweaver\/shell';/;

/**
 * Registers a generated plugin in a composition root we generated ourselves. Recognition is the
 * whole safety mechanism: the providers array and the shell import are matched by the shape the
 * scaffold writes, and anything else is declined rather than guessed at.
 */
export function composePlugin(
  source: string,
  amendment: ComposePluginAmendment,
  importPath: string,
): ComposeResult {
  if (source.includes(amendment.symbol)) {
    return { source, composed: true };
  }
  const providers = PROVIDERS.exec(source);
  const shellImport = SHELL_IMPORT.exec(source);
  if (!providers || !shellImport) {
    return { source, composed: false };
  }
  const withImports = source.replace(
    SHELL_IMPORT,
    `import {${withShellSymbols(shellImport[1])}} from '@loomweaver/shell';\nimport { ${amendment.symbol} } from '${importPath}';`,
  );
  const indent = `${providers[4]}  `;
  const lines = [
    `${indent}provideTranslationNamespaces('${amendment.id}'),`,
    `${indent}provideCapabilityGrants({ ${amendment.id}: [${amendment.capabilities
      .map((capability) => `'${capability}'`)
      .join(', ')}] }),`,
    `${indent}...providePlugins(${amendment.symbol}),`,
  ].join('\n');
  return {
    source: withImports.replace(
      PROVIDERS,
      (_all, head: string, body: string, tail: string) =>
        `${head}${body}\n${lines}${tail}`,
    ),
    composed: true,
  };
}

export function composeLines(
  amendment: ComposePluginAmendment,
  importPath: string,
): readonly string[] {
  return [
    `import { ${amendment.symbol} } from '${importPath}';`,
    "import { providePlugins, provideCapabilityGrants, provideTranslationNamespaces } from '@loomweaver/shell';",
    `provideTranslationNamespaces('${amendment.id}'),`,
    `provideCapabilityGrants({ ${amendment.id}: [${amendment.capabilities
      .map((capability) => `'${capability}'`)
      .join(', ')}] }),`,
    `...providePlugins(${amendment.symbol}),`,
  ];
}

function withShellSymbols(existing: string): string {
  const wanted = [
    'provideCapabilityGrants',
    'providePlugins',
    'provideTranslationNamespaces',
  ];
  const present = existing
    .split(',')
    .map((symbol) => symbol.trim())
    .filter(Boolean);
  const missing = wanted.filter(
    (symbol) => !present.some((entry) => entry.replace(/^type\s+/, '') === symbol),
  );
  if (missing.length === 0) {
    return existing;
  }
  const multiline = existing.includes('\n');
  const all = [...present, ...missing].sort((a, b) => a.localeCompare(b));
  return multiline ? `\n  ${all.join(',\n  ')},\n` : ` ${all.join(', ')} `;
}

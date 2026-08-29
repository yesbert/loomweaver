import { ComposePluginAmendment } from './types';

export interface ComposeResult {
  readonly source: string;
  readonly composed: boolean;
}

const APP_CONFIG = /export\s+const\s+appConfig\s*:[^=]*=\s*\{/;
const PROVIDERS_OPEN = /providers\s*:\s*\[/g;
const SHELL_IMPORT = /import\s*\{([^}]*)\}\s*from\s*'@loomweaver\/shell';/;

interface ProvidersBlock {
  readonly insertAt: number;
  readonly indent: string;
}

function closingLine(source: string, from: number): ProvidersBlock | null {
  let close = source.indexOf('],', from);
  while (close !== -1) {
    let start = close;
    while (start > from && source.charAt(start - 1).trim() === '') {
      start -= 1;
    }
    const gap = source.slice(start, close);
    const newline = gap.indexOf('\n');
    if (newline !== -1) {
      return { insertAt: start + newline, indent: gap.slice(newline + 1) };
    }
    close = source.indexOf('],', close + 2);
  }
  return null;
}

function providersBlock(source: string): ProvidersBlock | null {
  const declaration = APP_CONFIG.exec(source);
  if (!declaration) {
    return null;
  }
  PROVIDERS_OPEN.lastIndex = declaration.index + declaration[0].length;
  const open = PROVIDERS_OPEN.exec(source);
  return open ? closingLine(source, open.index + open[0].length) : null;
}

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
  const shellImport = SHELL_IMPORT.exec(source);
  if (!shellImport || !providersBlock(source)) {
    return { source, composed: false };
  }
  const withImports = source.replace(
    SHELL_IMPORT,
    `import {${withShellSymbols(shellImport[1])}} from '@loomweaver/shell';\nimport { ${amendment.symbol} } from '${importPath}';`,
  );
  const block = providersBlock(withImports);
  if (!block) {
    return { source, composed: false };
  }
  const indent = `${block.indent}  `;
  const lines = [
    `${indent}provideTranslationNamespaces('${amendment.id}'),`,
    `${indent}provideCapabilityGrants({ ${amendment.id}: [${amendment.capabilities
      .map((capability) => `'${capability}'`)
      .join(', ')}] }),`,
    `${indent}...providePlugins(${amendment.symbol}),`,
  ].join('\n');
  return {
    source: `${withImports.slice(0, block.insertAt)}\n${lines}${withImports.slice(block.insertAt)}`,
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

import { ComposePluginAmendment, ProviderLine } from './types';

export interface ComposeResult {
  readonly source: string;
  readonly composed: boolean;
  readonly kept: readonly string[];
}

const APP_CONFIG = /export\s+const\s+appConfig\s*:[^=]*=\s*\{/;
const NAMESPACES = /provideTranslationNamespaces\(([^)]*)\)/;
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
    return { source, composed: true, kept: [] };
  }
  const shellImport = SHELL_IMPORT.exec(source);
  if (!shellImport || !providersBlock(source)) {
    return { source, composed: false, kept: [] };
  }
  const wanted = providersToAdd(source, amendment);
  const ownSymbols = [amendment.symbol, ...wanted.flatMap((provider) => provider.own ?? [])];
  const foreign = wanted.flatMap((provider) => provider.from ?? []);
  const withImports = source.replace(
    SHELL_IMPORT,
    () =>
      [
        `import {${withShellSymbols(shellImport[1], wanted)}} from '@loomweaver/shell';`,
        ...foreign.map(
          (entry) => `import { ${[...entry.symbols].toSorted((a, b) => a.localeCompare(b)).join(', ')} } from '${entry.path}';`,
        ),
        `import { ${ownSymbols.toSorted((a, b) => a.localeCompare(b)).join(', ')} } from '${importPath}';`,
      ].join('\n'),
  );
  const joined = joinNamespaces(withImports, amendment.id);
  const block = providersBlock(joined.source);
  if (!block) {
    return { source, composed: false, kept: [] };
  }
  const indent = `${block.indent}  `;
  const lines = [
    ...wanted.map((provider) => `${indent}${provider.line}`),
    ...(joined.joined ? [] : [`${indent}provideTranslationNamespaces('${amendment.id}'),`]),
    `${indent}provideCapabilityGrants({ ${amendment.id}: [${amendment.capabilities
      .map((capability) => `'${capability}'`)
      .join(', ')}] }),`,
    `${indent}...providePlugins(${amendment.symbol}),`,
  ].join('\n');
  return {
    source: `${joined.source.slice(0, block.insertAt)}\n${lines}${joined.source.slice(block.insertAt)}`,
    composed: true,
    kept: keptProviders(source, amendment).map((provider) => provider.line),
  };
}

function joinNamespaces(
  source: string,
  id: string,
): { readonly source: string; readonly joined: boolean } {
  const existing = NAMESPACES.exec(source);
  if (!existing) {
    return { source, joined: false };
  }
  const names = existing[1]
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
  if (names.includes(`'${id}'`)) {
    return { source, joined: true };
  }
  return {
    source: source.replace(
      NAMESPACES,
      () => `provideTranslationNamespaces(${[...names, `'${id}'`].join(', ')})`,
    ),
    joined: true,
  };
}

function providersToAdd(
  source: string,
  amendment: ComposePluginAmendment,
): readonly ProviderLine[] {
  return (amendment.providers ?? []).filter(
    (provider) => !(provider.unless && source.includes(provider.unless)),
  );
}

function keptProviders(
  source: string,
  amendment: ComposePluginAmendment,
): readonly ProviderLine[] {
  return (amendment.providers ?? []).filter(
    (provider) => provider.unless !== undefined && source.includes(provider.unless),
  );
}

export function composeLines(
  amendment: ComposePluginAmendment,
  importPath: string,
): readonly string[] {
  const providers = amendment.providers ?? [];
  const own = [amendment.symbol, ...providers.flatMap((provider) => provider.own ?? [])];
  const shell = [
    'providePlugins',
    'provideCapabilityGrants',
    'provideTranslationNamespaces',
    ...providers.flatMap((provider) => provider.shell ?? []),
  ];
  return [
    `import { ${own.join(', ')} } from '${importPath}';`,
    `import { ${shell.join(', ')} } from '@loomweaver/shell';`,
    ...providers
      .flatMap((provider) => provider.from ?? [])
      .map((entry) => `import { ${entry.symbols.join(', ')} } from '${entry.path}';`),
    ...providers.map((provider) => provider.line),
    `provideTranslationNamespaces('${amendment.id}'),`,
    `provideCapabilityGrants({ ${amendment.id}: [${amendment.capabilities
      .map((capability) => `'${capability}'`)
      .join(', ')}] }),`,
    `...providePlugins(${amendment.symbol}),`,
  ];
}

function withShellSymbols(
  existing: string,
  providers: readonly ProviderLine[],
): string {
  const wanted = [
    'provideCapabilityGrants',
    'providePlugins',
    'provideTranslationNamespaces',
    ...providers.flatMap((provider) => provider.shell ?? []),
  ];
  const present = existing
    .split(',')
    .map((symbol) => symbol.trim())
    .filter(Boolean);
  const missing = wanted.filter(
    (symbol) => present.every((entry) => entry.replace(/^type\s+/, '') !== symbol),
  );
  if (missing.length === 0) {
    return existing;
  }
  const multiline = existing.includes('\n');
  const all = [...present, ...missing].toSorted((a, b) => a.localeCompare(b));
  return multiline ? `\n  ${all.join(',\n  ')},\n` : ` ${all.join(', ')} `;
}

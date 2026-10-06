import { posix } from 'node:path';
import { relativeImport } from './merge';
import {
  ComposePluginAmendment,
  ComposeProviderAmendment,
  ProviderLine,
} from './types';

export interface ComposeResult {
  readonly source: string;
  readonly composed: boolean;
  readonly kept: readonly string[];
}

const APP_CONFIG = /export\s+const\s+appConfig\s*:[^=]*=\s*\{/;
const NAMESPACES = /provideTranslationNamespaces\(([^)]*)\)/;
const PROVIDERS_OPEN = /providers\s*:\s*\[/g;
const SHELL_IMPORT = /import\s*\{([^}]*)\}\s*from\s*'@loomweaver\/shell';/;
const REGISTRATION_SHELL_SYMBOLS = [
  'providePlugins',
  'provideCapabilityGrants',
  'provideTranslationNamespaces',
];

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
  const withImports = source.replace(
    SHELL_IMPORT,
    () =>
      [
        `import {${withShellSymbols(shellImport[1], [...REGISTRATION_SHELL_SYMBOLS, ...shellSymbolsOf(wanted)])}} from '@loomweaver/shell';`,
        ...foreignImports(wanted),
        `import { ${sorted(ownSymbols).join(', ')} } from '${importPath}';`,
      ].join('\n'),
  );
  const joined = joinNamespaces(withImports, amendment.id);
  const block = providersBlock(joined.source);
  if (!block) {
    return { source, composed: false, kept: [] };
  }
  const indent = `${block.indent}  `;
  const registration = registrationLines(amendment, wanted);
  const lines = (
    joined.joined
      ? registration.filter((line) => line !== namespaceLine(amendment.id))
      : registration
  )
    .map((line) => `${indent}${line}`)
    .join('\n');
  return {
    source: `${joined.source.slice(0, block.insertAt)}\n${lines}${joined.source.slice(block.insertAt)}`,
    composed: true,
    kept: keptProviders(source, amendment).map((provider) => provider.line),
  };
}

/**
 * Composes provider lines that belong to no plugin into a composition root we generated ourselves,
 * under the rule a plugin's own provider lines follow. A line already there is left alone; a line
 * whose `unless` marker is there is kept as the consumer wrote it and returned as kept.
 */
export function composeProviders(
  source: string,
  amendment: ComposeProviderAmendment,
  importPath: string | undefined,
): ComposeResult {
  const pending = amendment.providers.filter(
    (provider) => !source.includes(provider.line.replace(/,$/, '')),
  );
  const kept = pending.filter(
    (provider) => provider.unless !== undefined && source.includes(provider.unless),
  );
  const wanted = pending.filter((provider) => !kept.includes(provider));
  const keptLines = kept.map((provider) => provider.line);
  if (wanted.length === 0) {
    return { source, composed: true, kept: keptLines };
  }
  const shellImport = SHELL_IMPORT.exec(source);
  if (!shellImport || !providersBlock(source)) {
    return { source, composed: false, kept: keptLines };
  }
  const own = wanted.flatMap((provider) => provider.own ?? []);
  const withImports = source.replace(SHELL_IMPORT, () =>
    [
      `import {${withShellSymbols(shellImport[1], shellSymbolsOf(wanted))}} from '@loomweaver/shell';`,
      ...foreignImports(wanted),
      ...(own.length > 0 && importPath !== undefined
        ? [`import { ${sorted(own).join(', ')} } from '${importPath}';`]
        : []),
    ].join('\n'),
  );
  const block = providersBlock(withImports);
  if (!block) {
    return { source, composed: false, kept: keptLines };
  }
  const lines = wanted.map((provider) => `${block.indent}  ${provider.line}`).join('\n');
  return {
    source: `${withImports.slice(0, block.insertAt)}\n${lines}${withImports.slice(block.insertAt)}`,
    composed: true,
    kept: keptLines,
  };
}

export function providerLines(
  amendment: ComposeProviderAmendment,
  importPath: string | undefined,
): readonly string[] {
  const own = amendment.providers.flatMap((provider) => provider.own ?? []);
  return [
    `import { ${shellSymbolsOf(amendment.providers).join(', ')} } from '@loomweaver/shell';`,
    ...foreignImports(amendment.providers),
    ...(own.length > 0 && importPath !== undefined
      ? [`import { ${own.join(', ')} } from '${importPath}';`]
      : []),
    ...amendment.providers.map((provider) => provider.line),
  ];
}

/** The specifier a composition root in `fromDirectory` imports a generated module under. */
export function moduleImport(
  fromDirectory: string,
  module: string | undefined,
): string | undefined {
  if (module === undefined) {
    return undefined;
  }
  const directory = relativeImport(fromDirectory, posix.dirname(module));
  return `${directory}/${posix.basename(module)}`;
}

/** What a route says about a provider line it did not add because the product already chose. */
export function keptNote(line: string): string {
  return `kept the ${line.replace(/^\.\.\./, '').split('(', 1)[0]} already there instead of ${line.replace(/,$/, '')}`;
}

function shellSymbolsOf(providers: readonly ProviderLine[]): string[] {
  return providers.flatMap((provider) => provider.shell ?? []);
}

function foreignImports(providers: readonly ProviderLine[]): string[] {
  return providers
    .flatMap((provider) => provider.from ?? [])
    .map((entry) => `import { ${sorted(entry.symbols).join(', ')} } from '${entry.path}';`);
}

function sorted(symbols: readonly string[]): string[] {
  return symbols.toSorted((a, b) => a.localeCompare(b));
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
  const namespaces = [...names, `'${id}'`].join(', ');
  return {
    source: source.replace(
      NAMESPACES,
      () => `provideTranslationNamespaces(${namespaces})`,
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
    ...REGISTRATION_SHELL_SYMBOLS,
    ...providers.flatMap((provider) => provider.shell ?? []),
  ];
  return [
    `import { ${own.join(', ')} } from '${importPath}';`,
    `import { ${shell.join(', ')} } from '@loomweaver/shell';`,
    ...providers
      .flatMap((provider) => provider.from ?? [])
      .map((entry) => `import { ${entry.symbols.join(', ')} } from '${entry.path}';`),
    ...registrationLines(amendment, providers),
  ];
}

export function registrationLines(
  amendment: ComposePluginAmendment,
  providers: readonly ProviderLine[],
): readonly string[] {
  return [
    ...providers.map((provider) => provider.line),
    namespaceLine(amendment.id),
    `provideCapabilityGrants({ ${grantKey(amendment.id)}: [${quotedList(amendment.capabilities)}] }),`,
    `...providePlugins(${amendment.symbol}),`,
  ];
}

export function grantKey(id: string): string {
  return /^[A-Za-z_$][\w$]*$/.test(id) ? id : `'${id}'`;
}

export function quotedList(values: readonly string[]): string {
  return values.map((value) => `'${value}'`).join(', ');
}

function namespaceLine(id: string): string {
  return `provideTranslationNamespaces('${id}'),`;
}

function withShellSymbols(existing: string, wanted: readonly string[]): string {
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

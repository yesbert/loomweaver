#!/usr/bin/env node
// Fails when a declaration the contract sections of llms-full.txt show is not the one the packages
// publish. `--write` rewrites what differs and keeps every comment where it stands.
//
// llms-full.txt is what an assistant reads instead of the guides, and its contract sections restate
// the published interfaces with an explanation beside each member. The explanations are the file's
// value and only a person writes them well; the signatures are a copy, and a copy nobody checks
// drifts. So the blocks are compiled in one program beside the PACKED declarations of the SDK, the
// shell, the agent connection and the frame kit, and every interface, type, function and class they
// declare under a published name is compared with the published one by what it accepts, not by how
// it is spelled. A union written out in full where the package names it, a `readonly` left off, or
// a parameter under another name is presentation and passes. A member the package has and the block
// lacks, one the block shows and the package dropped, a parameter the block leaves out, widens,
// narrows or makes optional, a return type that differs, a name no package publishes, and a name the
// block uses without declaring or the packages publishing all fail.
//
// Run it after `nx package plugin-sdk`, `nx package shell`, `nx package ag-ui` and
// `nx bundle frame-kit`.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { PUBLISHED_PACKAGES } from '../published-packages.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const platformRoot = path.join(repoRoot, 'platform');
const target = path.join(repoRoot, 'llms-full.txt');
const write = process.argv.includes('--write');

// The sections whose code blocks restate the published contract. Code under any other heading is an
// example of using it, and examples are not declarations.
const CONTRACT_HEADINGS = ['## The plugin contract', '## The distribution contract'];

const LIBRARIES = PUBLISHED_PACKAGES.filter((pkg) => pkg.role === 'library');
const missing = LIBRARIES.filter((pkg) => !existsSync(path.join(platformRoot, pkg.types)));
if (missing.length > 0) {
  console.error(
    `check-llms-contract: the packed declarations of ${missing.map((pkg) => pkg.name).join(', ')} ` +
      'are not built. Run `npx nx package plugin-sdk`, `npx nx package shell`, `npx nx package ag-ui` ' +
      'and `npx nx bundle frame-kit` first.',
  );
  process.exit(1);
}

// Published declarations whose real type cannot be named outside the package, each shown as opaque
// on purpose and with the reason.
const OPAQUE = new Map([
  ['PaneHandle', 'a branded string whose brand is not exported, so a consumer can hold one but not make one'],
]);

const printer = ts.createPrinter({ removeComments: true });

// The rollup qualifies names through its own import aliases (`i0.Signal`, `_loomweaver_shell.X`);
// a reader writes them bare.
function printed(node) {
  return printer
    .printNode(ts.EmitHint.Unspecified, node, node.getSourceFile())
    .replaceAll(/\s+/g, ' ')
    .replaceAll(/\b(?:i\d+|_[a-z][\w]*)\./g, '')
    .replace(/;\s*$/, '')
    .replace(/^(?:export )?(?:declare )?/, '')
    .trim();
}

// For a generic declaration the checker cannot relate two type parameters of different
// declarations, so it is compared as text, with its parameters renamed by position and `readonly`
// treated as presentation.
function normalised(text, parameters) {
  let next = text.replaceAll(/\breadonly /g, '');
  for (const [index, mapped] of [...new Set([...next.matchAll(/\[(\w+) in /g)].map((match) => match[1]))].entries()) {
    next = next.replaceAll(new RegExp(String.raw`\b${mapped}\b`, 'g'), () => `M${index}`);
  }
  for (const [index, parameter] of parameters.entries()) {
    next = next.replaceAll(new RegExp(String.raw`\b${parameter}\b`, 'g'), () => `T${index}`);
  }
  return next;
}

function typeParameters(node) {
  return (node.typeParameters ?? []).map((parameter) => parameter.name.text);
}

function kindOf(node) {
  if (ts.isInterfaceDeclaration(node)) return 'interface';
  if (ts.isClassDeclaration(node)) return 'class';
  if (ts.isTypeAliasDeclaration(node)) return 'type';
  if (ts.isFunctionDeclaration(node)) return 'function';
  return;
}

function contractBlocks(text) {
  return CONTRACT_HEADINGS.map((heading) => {
    const at = text.indexOf(`\n${heading}`);
    if (at === -1) {
      console.error(`check-llms-contract: llms-full.txt has no "${heading}" section any more.`);
      process.exit(1);
    }
    const start = text.indexOf('```ts\n', at) + '```ts\n'.length;
    return { start, end: text.indexOf('\n```', start) + 1 };
  });
}

const original = readFileSync(target, 'utf8');
const blocks = contractBlocks(original);
const entries = Object.fromEntries(LIBRARIES.map((pkg) => [pkg.name, path.join(platformRoot, pkg.types)]));
const moduleEntries = Object.fromEntries(
  Object.entries(entries).filter(([name]) => name !== '@loomweaver/frame-kit'),
);

// The blocks name Angular's own types beside ours, the way a consumer's code does.
const FRAMEWORK = ['@angular/core', '@angular/router'];

// Pass one: what the packages publish, by the name a consumer writes.
const frameworkEntries = FRAMEWORK.map((name) =>
  ts.resolveModuleName(name, path.join(platformRoot, 'index.ts'), { moduleResolution: ts.ModuleResolutionKind.Bundler, module: ts.ModuleKind.Preserve }, ts.sys).resolvedModule?.resolvedFileName,
);
const base = ts.createProgram([...Object.values(entries), ...frameworkEntries.filter(Boolean)], { skipLibCheck: true, noEmit: true });
const baseChecker = base.getTypeChecker();
const publishedIn = new Map();
for (const [name, entry] of Object.entries(entries)) {
  const source = base.getSourceFile(entry);
  const module = baseChecker.getSymbolAtLocation(source);
  const symbols = module
    ? baseChecker.getExportsOfModule(module)
    : source.statements
        .filter((statement) => statement.name)
        .map((statement) => baseChecker.getSymbolAtLocation(statement.name));
  for (const symbol of symbols) {
    if (symbol && !publishedIn.has(symbol.name)) publishedIn.set(symbol.name, name);
  }
}
const frameworkIn = new Map();
for (const [index, name] of FRAMEWORK.entries()) {
  const source = frameworkEntries[index] && base.getSourceFile(frameworkEntries[index]);
  const module = source && baseChecker.getSymbolAtLocation(source);
  for (const symbol of module ? baseChecker.getExportsOfModule(module) : []) {
    if (!frameworkIn.has(symbol.name)) frameworkIn.set(symbol.name, name);
  }
}

// Pass two: each block becomes a module of its own, importing every published name it uses but does
// not declare, and importing each name it does declare a second time under a prefix, so the two can
// be compared in one checker.
const PUBLISHED = '__published_';
const files = new Map();
const declaredIn = [];
for (const [index, block] of blocks.entries()) {
  const code = original.slice(block.start, block.end);
  const source = ts.createSourceFile(`block-${index}.d.ts`, code, ts.ScriptTarget.Latest, true);
  const declared = source.statements.filter((statement) => kindOf(statement) && statement.name);
  const own = new Set(declared.map((statement) => statement.name.text));
  const used = new Set();
  const visit = (node) => {
    if (ts.isTypeReferenceNode(node) || ts.isExpressionWithTypeArguments(node)) {
      const head = (ts.isTypeReferenceNode(node) ? node.typeName : node.expression).getText(source).split('.', 1)[0];
      used.add(head);
    }
    if (ts.isTypeQueryNode(node)) used.add(node.exprName.getText(source).split('.', 1)[0]);
    if (ts.isIdentifier(node) && ts.isCallExpression(node.parent) && node.parent.expression === node) used.add(node.text);
    ts.forEachChild(node, visit);
  };
  visit(source);
  const imports = new Map();
  const want = (name, alias) => {
    const from = publishedIn.get(name) ?? (alias ? undefined : frameworkIn.get(name));
    if (!from || (!Object.hasOwn(moduleEntries, from) && !FRAMEWORK.includes(from))) return;
    const list = imports.get(from) ?? [];
    list.push(alias ? `${name} as ${alias}` : name);
    imports.set(from, list);
  };
  for (const name of used) if (!own.has(name)) want(name);
  for (const name of own) if (!OPAQUE.has(name)) want(name, `${PUBLISHED}${name}`);
  let compiled = code;
  for (const name of OPAQUE.keys()) {
    if (!own.has(name)) continue;
    compiled = compiled.replace(new RegExp(String.raw`\btype ${name}\b`), () => `type ${name.slice(0, -1)}_`);
    want(name);
  }
  const header = [...imports]
    .map(([from, names]) => `import type { ${names.join(', ')} } from '${from}';`)
    .join('\n');
  const file = path.join(platformRoot, `llms-contract-block-${index}.d.ts`);
  const text = `${header}\nexport {};\n${compiled}`;
  files.set(file, text);
  declaredIn.push({ file, block, offset: header.length + '\nexport {};\n'.length, declared });
}

const options = {
  strict: true,
  skipLibCheck: true,
  noEmit: true,
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.Preserve,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  paths: Object.fromEntries(Object.entries(moduleEntries).map(([name, entry]) => [name, [entry]])),
};
const host = ts.createCompilerHost(options);
const readFile = host.readFile.bind(host);
const getSourceFile = host.getSourceFile.bind(host);
host.fileExists = ((exists) => (file) => files.has(path.resolve(file)) || exists(file))(host.fileExists.bind(host));
host.readFile = (file) => files.get(path.resolve(file)) ?? readFile(file);
host.getSourceFile = (file, language) => {
  const text = files.get(path.resolve(file));
  return text === undefined ? getSourceFile(file, language) : ts.createSourceFile(file, text, language, true);
};
const program = ts.createProgram([...files.keys(), entries['@loomweaver/frame-kit']], options, host);
const checker = program.getTypeChecker();

const problems = [];
const edits = [];
let compared = 0;

function lineIn(info, position) {
  return original.slice(0, info.block.start + position - info.offset).split('\n').length;
}

function same(a, b) {
  return checker.isTypeAssignableTo(a, b) && checker.isTypeAssignableTo(b, a);
}

// Assignability alone lets a parameter go missing or grow wider. A function that takes fewer
// parameters is assignable to one that takes more, one that takes a wider parameter is assignable to
// one that takes a narrower, and the parameters of a method are compared in both directions at once,
// so `open(id: string | number)` and `open(id: string, options?: Options)` both passed as
// `open(id: string)`. An assistant that reads the page then never passes the option, or passes what
// the package refuses. So the parameters are compared one by one: the same number of them, each
// optional or rest exactly where the published one is, and each of a type that accepts what the
// published one accepts and nothing more.
//
// What stays presentation: a parameter's name, a parameter the page leaves untyped, and a `readonly`
// left off an array, which is the one place the modifier changes assignability and so needs saying.
// Where a parameter is typed by a type parameter of its own signature the checker cannot relate the
// two, and the type is compared as text with those parameters renamed by position, the way a
// generic declaration is.
function typeParametersOf(signature) {
  return (signature.getTypeParameters() ?? []).map((parameter) => parameter.symbol.name);
}

function sameButForReadonly(shown, published) {
  if (same(shown, published)) return true;
  return (
    checker.isArrayType(shown) &&
    checker.isArrayType(published) &&
    sameButForReadonly(
      checker.getIndexTypeOfType(shown, ts.IndexKind.Number),
      checker.getIndexTypeOfType(published, ts.IndexKind.Number),
    )
  );
}

function sameParameter(shown, shownGenerics, published, publishedGenerics) {
  const [mine, theirs] = [shown.valueDeclaration, published.valueDeclaration];
  if (
    mine &&
    theirs &&
    (checker.isOptionalParameter(mine) !== checker.isOptionalParameter(theirs) ||
      Boolean(mine.dotDotDotToken) !== Boolean(theirs.dotDotDotToken))
  ) {
    return false;
  }
  if (sameButForReadonly(checker.getTypeOfSymbol(shown), checker.getTypeOfSymbol(published))) return true;
  return Boolean(
    mine?.type &&
      theirs?.type &&
      shownGenerics.length === publishedGenerics.length &&
      normalised(printed(mine.type), shownGenerics) === normalised(printed(theirs.type), publishedGenerics),
  );
}

function sameParameters(shown, published) {
  const [mine, theirs] = [shown.getParameters(), published.getParameters()];
  const [shownGenerics, publishedGenerics] = [typeParametersOf(shown), typeParametersOf(published)];
  return (
    mine.length === theirs.length &&
    mine.every((parameter, index) => sameParameter(parameter, shownGenerics, theirs[index], publishedGenerics))
  );
}

// A member the page shows with its parameters: every signature shown is one the package publishes,
// and every one the package publishes is shown. A member named without a signature shows nothing
// to compare, which is how the page lists what a reader rarely calls.
function sameCallSignatures(shownType, publishedType) {
  const shown = checker.getNonNullableType(shownType).getCallSignatures();
  if (shown.length === 0) return true;
  const published = checker.getNonNullableType(publishedType).getCallSignatures();
  return (
    shown.every((signature) => published.some((candidate) => sameParameters(signature, candidate))) &&
    published.every((signature) => shown.some((candidate) => sameParameters(candidate, signature)))
  );
}

function sameMember(shownType, publishedType) {
  return same(shownType, publishedType) && sameCallSignatures(shownType, publishedType);
}

function publishedSymbol(sourceFile, name) {
  const local = checker.getSymbolsInScope(sourceFile, ts.SymbolFlags.Alias).find((symbol) => symbol.name === `${PUBLISHED}${name}`);
  if (local) return checker.getAliasedSymbol(local);
  return checker
    .getSymbolsInScope(sourceFile, ts.SymbolFlags.Type | ts.SymbolFlags.Value)
    .find((symbol) => symbol.name === name && symbol.declarations?.some((d) => d.getSourceFile().fileName === entries['@loomweaver/frame-kit']));
}

function membersOf(type) {
  return new Map(
    checker
      .getPropertiesOfType(type)
      .filter((symbol) => !symbol.valueDeclaration || !(ts.getCombinedModifierFlags(symbol.valueDeclaration) & ts.ModifierFlags.Private))
      .map((symbol) => [symbol.name, symbol]),
  );
}

function memberText(symbol) {
  const declaration = symbol.declarations?.[0];
  return declaration ? printed(declaration) : symbol.name;
}

function replaceWith(info, node, text) {
  edits.push({
    from: info.block.start + node.getStart() - info.offset,
    to: info.block.start + node.end - info.offset,
    text: `${text};`,
  });
}

for (const info of declaredIn) {
  const sourceFile = program.getSourceFile(info.file);
  for (const diagnostic of ts.getPreEmitDiagnostics(program, sourceFile)) {
    if (diagnostic.start === undefined || diagnostic.start < info.offset) continue;
    problems.push(`llms-full.txt:${lineIn(info, diagnostic.start)}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')}`);
  }
  for (const statement of sourceFile.statements) {
    const kind = kindOf(statement);
    if (!kind || !statement.name) continue;
    const name = statement.name.text;
    if ([...OPAQUE.keys()].some((opaque) => name === `${opaque.slice(0, -1)}_`)) continue;
    const at = `llms-full.txt:${lineIn(info, statement.getStart())}`;
    const theirs = publishedSymbol(sourceFile, name);
    if (!theirs) {
      problems.push(`${at}: shows ${name}, which no package publishes`);
      continue;
    }
    const ours = checker.getSymbolAtLocation(statement.name);
    compared += 1;
    if (kind === 'function') {
      const shown = checker.getTypeOfSymbolAtLocation(ours, statement);
      const wanted = checker.getTypeOfSymbol(theirs);
      const signatures = wanted.getCallSignatures();
      const [shownSignature] = shown.getCallSignatures();
      const match = signatures.some((signature) =>
        same(checker.getReturnTypeOfSignature(signature), checker.getReturnTypeOfSignature(shownSignature)) &&
        sameParameters(shownSignature, signature) &&
        checker.isTypeAssignableTo(shown, wanted),
      );
      if (!match) {
        const text = (theirs.declarations ?? []).map((declaration) => printed(declaration));
        problems.push(`${at}: ${name} is published as\n      ${text.join('\n      ')}\n    but shown as\n      ${printed(statement)}`);
        replaceWith(info, statement, text[0]);
      }
      continue;
    }
    const shownType = checker.getDeclaredTypeOfSymbol(ours);
    const wantedType = checker.getDeclaredTypeOfSymbol(theirs);
    if (kind === 'type') {
      const declaration = theirs.declarations[0];
      const generic = statement.typeParameters?.length;
      const differs = generic
        ? normalised(printed(statement).replace(/^type \w+<[^>]*>/, ''), typeParameters(statement)) !==
          normalised(printed(declaration).replace(/^type \w+<[^>]*>/, ''), typeParameters(declaration))
        : !same(shownType, wantedType);
      if (differs) {
        const text = printed(theirs.declarations[0]);
        problems.push(`${at}: ${name} is published as\n      ${text}\n    but shown as\n      ${printed(statement)}`);
        replaceWith(info, statement, text);
      }
      continue;
    }
    const generic = (statement.typeParameters?.length ?? 0) > 0;
    const shownMembers = membersOf(shownType);
    const wantedMembers = membersOf(wantedType);
    for (const [member, symbol] of shownMembers) {
      const node = symbol.declarations?.find((declaration) => declaration.getSourceFile() === sourceFile);
      if (!node) continue;
      const where = `llms-full.txt:${lineIn(info, node.getStart())}`;
      const published = wantedMembers.get(member);
      if (!published) {
        problems.push(`${where}: ${name}.${member} is shown, but the package has no such member`);
        continue;
      }
      const optional = (symbol.flags & ts.SymbolFlags.Optional) !== (published.flags & ts.SymbolFlags.Optional);
      const spelledAlike = normalised(printed(node), []) === normalised(memberText(published), []);
      const differs = !spelledAlike && (generic
        ? normalised(printed(node), typeParameters(statement)) !==
          normalised(memberText(published), typeParameters(theirs.declarations[0]))
        : optional || !sameMember(checker.getTypeOfSymbolAtLocation(symbol, node), checker.getTypeOfSymbol(published)));
      if (!differs) continue;
      problems.push(`${where}: ${name}.${member} is published as\n      ${memberText(published)}\n    but shown as\n      ${printed(node)}`);
      const keepsReadonly = printed(node).startsWith('readonly ');
      replaceWith(info, node, keepsReadonly ? memberText(published) : memberText(published).replace(/^readonly /, ''));
    }
    // A class is a service, and a block lists the members a reader needs; an interface is a shape a
    // plugin fills or reads, and a block that leaves a member out misleads whoever fills it.
    const absent = [...wantedMembers.keys()].filter((member) => !shownMembers.has(member));
    if (kind !== 'interface' || absent.length === 0) continue;
    problems.push(`${at}: ${name} lacks ${absent.join(', ')}, which the package publishes`);
    const texts = absent.map((member) => memberText(wantedMembers.get(member)).replace(/^readonly /, ''));
    const body = statement.getText();
    const close = info.block.start + statement.end - 1 - info.offset;
    if (body.includes('\n')) {
      const first = statement.members[0];
      const indent = ' '.repeat(sourceFile.getLineAndCharacterOfPosition(first.getStart()).character);
      edits.push({ from: close, to: close, text: `${texts.map((text) => `${indent}${text};`).join('\n')}\n` });
    } else {
      const last = statement.members.at(-1);
      const after = info.block.start + (last ? last.end : statement.end - 1) - info.offset;
      const separator = last && !last.getText().endsWith(';') ? '; ' : ' ';
      edits.push({ from: after, to: after, text: `${separator}${texts.join('; ')}` });
    }
  }
}

if (write && edits.length > 0) {
  let next = original;
  for (const edit of edits.toSorted((a, b) => b.from - a.from)) {
    next = next.slice(0, edit.from) + edit.text + next.slice(edit.to);
  }
  writeFileSync(target, next);
  console.log(
    `check-llms-contract: rewrote ${edits.length} declaration(s) in llms-full.txt to what the packages publish. ` +
      'Read the diff: a comment beside a rewritten line may need the same change.',
  );
  process.exit(0);
}

if (problems.length > 0) {
  console.error('check-llms-contract: llms-full.txt shows declarations the packages do not publish that way:');
  for (const problem of problems) {
    console.error(`  ${problem}`);
  }
  console.error('\n`node tools/checks/check-llms-contract.mjs --write` rewrites the declarations; the comments beside them stay where they are.');
  process.exit(1);
}
console.log(`check-llms-contract: ${compared} declarations in the contract sections of llms-full.txt accept what the packed declarations accept.`);

import type * as TS from 'typescript';
import { Finding } from './types';
import type { TypeScriptModule } from './typescript';

/** One source file the command check reads: its path, for the report, and its text. */
export interface CommandSource {
  readonly path: string;
  readonly text: string;
}

/** The line every report ends with: what the check did not judge, because only the running workbench can. */
export const RUNTIME_NOTE =
  'Grants, access and the window decide what is finally offered at runtime; this check judged the registrations alone.';

interface Registration {
  readonly at: string;
  readonly id?: string;
  readonly callable: boolean;
  readonly described: boolean;
  readonly answers: boolean;
  readonly returnsValue: boolean;
  readonly arguments: readonly { readonly name: string; readonly described: boolean }[];
  readonly unreadable?: string;
}

/**
 * Reads every `registerCommand` literal in the given sources and reports, per command, whether an
 * agent is offered it, what would leave the agent guessing, or that the registration could not be
 * read. Only a callable command without a description is a warning; the rest is information, so a
 * plugin with private commands passes a strict run. The TypeScript compiler is passed in rather
 * than imported, so the check costs nothing where it is not used.
 */
export function validateCommands(
  sources: readonly CommandSource[],
  ts: TypeScriptModule,
): Finding[] {
  const findings: Finding[] = [];
  for (const source of sources) {
    const file = ts.createSourceFile(source.path, source.text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    for (const call of registerCommandCalls(ts, file)) {
      findings.push(...judge(read(ts, file, call)));
    }
  }
  findings.push({ level: 'info', code: 'commands.runtime', message: RUNTIME_NOTE });
  return findings;
}

function registerCommandCalls(ts: TypeScriptModule, file: TS.SourceFile): TS.CallExpression[] {
  const calls: TS.CallExpression[] = [];
  const visit = (node: TS.Node): void => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'registerCommand'
    ) {
      calls.push(node);
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return calls;
}

function read(ts: TypeScriptModule, file: TS.SourceFile, call: TS.CallExpression): Registration {
  const line = file.getLineAndCharacterOfPosition(call.getStart(file)).line + 1;
  const at = `${file.fileName}:${line}`;
  const literal = call.arguments[0];
  const empty: Registration = { at, callable: false, described: false, answers: false, returnsValue: false, arguments: [] };
  if (!literal || !ts.isObjectLiteralExpression(literal)) {
    return { ...empty, unreadable: 'its argument is not an object literal' };
  }
  const properties = new Map<string, TS.Expression>();
  for (const property of literal.properties) {
    if (ts.isSpreadAssignment(property)) {
      return { ...empty, unreadable: 'it spreads another value into the registration' };
    }
    if (ts.isPropertyAssignment(property) && (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))) {
      properties.set(property.name.text, property.initializer);
    } else if (ts.isMethodDeclaration(property) && ts.isIdentifier(property.name)) {
      properties.set(property.name.text, property as unknown as TS.Expression);
    }
  }
  const id = properties.get('id');
  if (!id || !ts.isStringLiteral(id)) {
    return { ...empty, unreadable: 'its id is not a string literal' };
  }
  const callable = properties.get('callable');
  return {
    at,
    id: id.text,
    callable: callable !== undefined && callable.kind === ts.SyntaxKind.TrueKeyword,
    described: properties.has('description'),
    answers: properties.has('answers'),
    returnsValue: returnsValue(ts, properties.get('run')),
    arguments: readArguments(ts, properties.get('arguments')),
  };
}

function readArguments(
  ts: TypeScriptModule,
  value: TS.Expression | undefined,
): readonly { readonly name: string; readonly described: boolean }[] {
  if (!value || !ts.isArrayLiteralExpression(value)) {
    return [];
  }
  return value.elements.map((element, index) => {
    if (!ts.isObjectLiteralExpression(element)) {
      return { name: `#${index + 1}`, described: false };
    }
    let name = `#${index + 1}`;
    let described = false;
    for (const property of element.properties) {
      if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name)) {
        continue;
      }
      if (property.name.text === 'name' && ts.isStringLiteral(property.initializer)) {
        name = property.initializer.text;
      }
      if (property.name.text === 'description') {
        described = true;
      }
    }
    return { name, described };
  });
}

function returnsValue(ts: TypeScriptModule, run: TS.Node | undefined): boolean {
  if (!run) {
    return false;
  }
  if (ts.isArrowFunction(run) && !ts.isBlock(run.body)) {
    return ts.isObjectLiteralExpression(run.body) || ts.isArrayLiteralExpression(run.body);
  }
  let found = false;
  const visit = (node: TS.Node): void => {
    if (found || ts.isFunctionLike(node) && node !== run) {
      return;
    }
    if (ts.isReturnStatement(node) && node.expression && node.expression.kind !== ts.SyntaxKind.UndefinedKeyword) {
      found = true;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(run);
  return found;
}

function judge(registration: Registration): Finding[] {
  const { at, id } = registration;
  if (registration.unreadable) {
    return [
      {
        level: 'info',
        code: 'command.unreadable',
        path: at,
        message: `A registerCommand call at ${at} could not be read: ${registration.unreadable}. What it offers an agent is unknown here.`,
      },
    ];
  }
  if (!registration.callable) {
    return [
      {
        level: 'info',
        code: 'command.private',
        path: at,
        message: `${id}: not offered to an agent, because it is not callable; an agent never sees it.`,
      },
    ];
  }
  const findings: Finding[] = [];
  if (!registration.described) {
    findings.push({
      level: 'warning',
      code: 'command.description',
      path: at,
      message: `${id}: offered to an agent without a description; the agent sees only the id and has to guess what it does.`,
    });
  }
  for (const argument of registration.arguments) {
    if (!argument.described) {
      findings.push({
        level: 'info',
        code: 'command.argument',
        path: at,
        message: `${id}: argument "${argument.name}" has no description; an agent sees a bare name and guesses its value.`,
      });
    }
  }
  if (registration.returnsValue && !registration.answers) {
    findings.push({
      level: 'info',
      code: 'command.answers',
      path: at,
      message: `${id}: run returns a value but declares no answers; an agent hears that the command ran, not what it answered.`,
    });
  }
  if (findings.length === 0) {
    const count = registration.arguments.length;
    findings.push({
      level: 'info',
      code: 'command.offered',
      path: at,
      message: `${id}: offered to an agent, with ${count} described argument${count === 1 ? '' : 's'}${registration.answers ? ' and a declared answer' : ''}.`,
    });
  }
  return findings;
}

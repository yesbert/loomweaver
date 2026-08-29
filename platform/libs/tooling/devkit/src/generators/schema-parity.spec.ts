import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { nxSchemaFor, SCAFFOLDS } from '../lib/scaffolds/scaffolds';

const GENERATORS = join(import.meta.dirname);

function schemaTypeProperties(name: string): string[] {
  const path = join(GENERATORS, name, 'schema.d.ts');
  const source = ts.createSourceFile(
    path,
    readFileSync(path, 'utf8'),
    ts.ScriptTarget.Latest,
  );
  const properties: string[] = [];
  source.forEachChild((node) => {
    if (!ts.isInterfaceDeclaration(node)) return;
    for (const member of node.members) {
      if (ts.isPropertySignature(member) && ts.isIdentifier(member.name)) {
        properties.push(member.name.text);
      }
    }
  });
  return properties;
}

describe('Nx generator schemas', () => {
  it.each(SCAFFOLDS.map((scaffold) => [scaffold.name, scaffold] as const))(
    'keeps %s/schema.json in step with the scaffold descriptor',
    (name, scaffold) => {
      const onDisk = JSON.parse(
        readFileSync(join(GENERATORS, name, 'schema.json'), 'utf8'),
      );
      expect(onDisk).toEqual(nxSchemaFor(scaffold));
    },
  );

  it.each(SCAFFOLDS.map((scaffold) => [scaffold.name, scaffold] as const))(
    'keeps %s/schema.d.ts in step with the scaffold descriptor',
    (name, scaffold) => {
      expect(schemaTypeProperties(name).toSorted()).toEqual(
        scaffold.options.map((option) => option.name).toSorted(),
      );
    },
  );

  it.each(SCAFFOLDS.map((scaffold) => [scaffold.name, scaffold] as const))(
    'gives %s recipe fallbacks that equal the declared descriptor defaults',
    (_, scaffold) => {
      const required: Record<string, string> = {};
      for (const option of scaffold.options) {
        if (option.required) {
          required[option.name] = 'sample';
        }
      }
      const declared = { ...required };
      for (const option of scaffold.options) {
        if (option.default !== undefined) {
          declared[option.name] = option.default as never;
        }
      }
      expect(scaffold.build(required)).toEqual(scaffold.build(declared));
    },
  );
});

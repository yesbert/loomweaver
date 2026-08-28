import {
  describeAmendment,
  portableOptions,
  ScaffoldDescriptor,
  ScaffoldValues,
  SCAFFOLDS,
  validateCatalog,
  validateI18nParity,
  validateManifest,
} from '@loomweaver/devkit';

export interface ToolResult {
  [key: string]: unknown;
  content: { type: 'text'; text: string }[];
  structuredContent: Record<string, unknown>;
}

type Args = Record<string, unknown>;

function ok(data: Record<string, unknown>): ToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
  };
}

export function toolName(scaffold: ScaffoldDescriptor): string {
  return `scaffold_${scaffold.name.replace(/-/g, '_')}`;
}

export function listGenerators(): ToolResult {
  return ok({
    generators: SCAFFOLDS.map((scaffold) => ({
      name: scaffold.name,
      description: scaffold.summary,
    })),
  });
}

function valuesFor(scaffold: ScaffoldDescriptor, args: Args): ScaffoldValues {
  const values: Record<string, string | boolean | undefined> = {};
  for (const option of portableOptions(scaffold)) {
    const value = args[option.name];
    if (option.type === 'string' && typeof value === 'string') {
      values[option.name] = value;
    }
    if (option.type === 'boolean' && typeof value === 'boolean') {
      values[option.name] = value;
    }
  }
  return values;
}

export function scaffold(
  scaffold: ScaffoldDescriptor,
  args: Args,
): ToolResult {
  const values = valuesFor(scaffold, args);
  const remaining = (scaffold.amend?.(values) ?? []).map(describeAmendment);
  return ok({
    files: scaffold.build(values),
    ...(remaining.length > 0 ? { remaining } : {}),
  });
}

export function validateManifestTool(a: Args): ToolResult {
  return ok({
    findings: validateManifest({
      id: a['id'],
      name: a['name'],
      capabilities: a['capabilities'],
    }),
  });
}

export function validateCatalogTool(a: Args): ToolResult {
  return ok({ findings: validateCatalog(a['catalog']) });
}

export function validateI18nTool(a: Args): ToolResult {
  const bundles = (a['bundles'] ?? {}) as Record<
    string,
    Record<string, unknown>
  >;
  return ok({ findings: validateI18nParity(bundles) });
}

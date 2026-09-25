import { kebabCase, ScaffoldDescriptor, ScaffoldOption } from './scaffolds';

/** The option surface an adapter that only produces files can offer. */
export function portableOptions(
  scaffold: ScaffoldDescriptor,
): readonly ScaffoldOption[] {
  return scaffold.options.filter((option) => !option.workspaceOnly);
}

/**
 * The JSON Schema an Nx generator loads. Nx reads it from disk before any of our code runs, so the
 * file cannot be computed at call time — instead it is checked against this shape by a test, which
 * fails the moment the two drift apart.
 */
export function nxSchemaFor(
  scaffold: ScaffoldDescriptor,
): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  for (const option of scaffold.options) {
    properties[option.name] = {
      type: option.type,
      description: option.description,
      ...(option.pattern && { pattern: option.pattern }),
      ...(option.choices && { enum: option.choices }),
      ...(option.default !== undefined && { default: option.default }),
    };
  }
  return {
    $schema: 'https://json-schema.org/schema',
    $id: `LoomWeaver${scaffold.name
      .split('-')
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join('')}`,
    title: `Scaffold ${scaffold.summary}`,
    type: 'object',
    properties,
    required: scaffold.options
      .filter((option) => option.required)
      .map((option) => option.name),
  };
}

export function usageFor(scaffold: ScaffoldDescriptor): string {
  const parts = portableOptions(scaffold).map((option) => {
    const flag = `--${kebabCase(option.name)}`;
    const body = option.type === 'boolean' ? flag : `${flag} <${option.name}>`;
    return option.required ? body : `[${body}]`;
  });
  return [scaffold.name, ...parts].join(' ');
}

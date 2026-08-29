import type { Tool } from '@ag-ui/core';
import type { CommandArgument, InvocableCommand } from '@loomweaver/plugin-sdk';

interface JsonSchemaProperty {
  readonly type: string;
  readonly description: string;
  readonly enum?: readonly string[];
  readonly items?: Omit<JsonSchemaProperty, 'description'>;
}

interface JsonSchemaObject {
  readonly type: 'object';
  readonly properties: Readonly<Record<string, JsonSchemaProperty>>;
  readonly required: readonly string[];
}

const SCALAR_TYPE: Readonly<Record<string, string>> = {
  text: 'string',
  number: 'number',
  boolean: 'boolean',
  choice: 'string',
};

/**
 * Describes one command the workbench offers as a tool an agent can call. The id becomes the tool
 * name, so a call names the same identity the workbench knows it by, and nothing has to be looked up
 * in a table on the way back.
 *
 * A command with no description of its own gets one derived from its title. The protocol requires a
 * description and an agent chooses between tools by reading it, so an empty string would make the
 * tool unpickable; the title is a poor explanation but it is not nothing, and the workbench warns the
 * author in dev mode when a command is opened without one.
 */
export function toolFor(command: InvocableCommand): Tool {
  return {
    name: command.id,
    description: command.description ?? command.title,
    parameters: parametersFor(command.arguments),
  };
}

/** Describes every command in the list, in the order the workbench gave them. */
export function toolsFor(commands: readonly InvocableCommand[]): readonly Tool[] {
  return commands.map(toolFor);
}

function parametersFor(
  args: readonly CommandArgument[] | undefined,
): JsonSchemaObject {
  const declared = args ?? [];
  const properties: Record<string, JsonSchemaProperty> = {};
  for (const argument of declared) {
    properties[argument.name] = propertyFor(argument);
  }
  return {
    type: 'object',
    properties,
    required: declared
      .filter((argument) => argument.required === true)
      .map((argument) => argument.name),
  };
}

function propertyFor(argument: CommandArgument): JsonSchemaProperty {
  const scalar = {
    type: SCALAR_TYPE[argument.kind] ?? 'string',
    ...(argument.kind === 'choice' && { enum: argument.choices }),
  };
  return argument.list === true
    ? { type: 'array', description: argument.description, items: scalar }
    : { ...scalar, description: argument.description };
}

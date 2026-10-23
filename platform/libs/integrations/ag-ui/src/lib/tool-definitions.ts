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

const SCALAR_TYPE: Readonly<Record<CommandArgument['kind'], string>> = {
  text: 'string',
  number: 'number',
  boolean: 'boolean',
  choice: 'string',
};

/**
 * Describes one command the workbench offers as a tool an agent can call. The tool is named after the
 * command id in the form the common model interfaces accept, letters, digits, underscores and hyphens
 * and at most 64 of them, with each dot spelled as two underscores (`notes.open` is `notes__open`).
 * A call comes back by that name and is matched against the tools offered at that moment.
 *
 * Where the command says how much an agent may do without asking, that statement rides in the
 * protocol's own place for a property of a tool, under the name it was declared with, so an agent host can
 * treat a consequential tool differently. A command that says nothing carries no `metadata` at all.
 *
 * A command with no description of its own gets one derived from its title. The protocol requires a
 * description and an agent chooses between tools by reading it, so an empty string would make the
 * tool unpickable; the title is a poor explanation but it is not nothing, and the workbench warns the
 * author in dev mode when a command is callable without one.
 */
export function toolFor(command: InvocableCommand): Tool {
  return {
    name: toolNameOf(command.id),
    description: command.description ?? command.title,
    parameters: parametersFor(command.arguments),
    ...(command.agentConsent !== undefined && {
      metadata: { agentConsent: command.agentConsent },
    }),
  };
}

/**
 * Describes every command in the list, in the order the workbench gave them. Where two commands would
 * share a tool name, the first is offered and the second is not.
 */
export function toolsFor(commands: readonly InvocableCommand[]): readonly Tool[] {
  return [...offeredByName(commands).values()].map((command) => toolFor(command));
}

/** The command a call names by its tool name, among the commands offered, or nothing. */
export function offeredCommand(
  commands: readonly InvocableCommand[],
  toolName: string,
): InvocableCommand | undefined {
  return offeredByName(commands).get(toolName);
}

const TOOL_NAME_LIMIT = 64;

function toolNameOf(commandId: string): string {
  const name = commandId.replaceAll('.', '__').replaceAll(/[^A-Za-z0-9_-]/g, '_');
  if (name.length <= TOOL_NAME_LIMIT) {
    return name;
  }
  const suffix = `_${digestOf(commandId)}`;
  return name.slice(0, TOOL_NAME_LIMIT - suffix.length) + suffix;
}

function digestOf(text: string): string {
  let hash = 0x81_1C_9D_C5;
  for (const char of text) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01_00_01_93) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function offeredByName(
  commands: readonly InvocableCommand[],
): ReadonlyMap<string, InvocableCommand> {
  const byName = new Map<string, InvocableCommand>();
  for (const command of commands) {
    const name = toolNameOf(command.id);
    if (!byName.has(name)) {
      byName.set(name, command);
    }
  }
  return byName;
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
    type: SCALAR_TYPE[argument.kind],
    ...(argument.kind === 'choice' && { enum: argument.choices }),
  };
  return argument.list === true
    ? { type: 'array', description: argument.description, items: scalar }
    : { ...scalar, description: argument.description };
}

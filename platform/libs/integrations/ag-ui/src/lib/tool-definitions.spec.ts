import { InvocableCommand } from '@loomweaver/plugin-sdk';
import { toolFor, toolsFor } from './tool-definitions';

function command(over: Partial<InvocableCommand> = {}): InvocableCommand {
  return { id: 'notes.open', title: 'Open note', ...over };
}

describe('toolFor', () => {
  it('names the tool in the form the model interfaces accept, dots spelled as two underscores', () => {
    expect(toolFor(command()).name).toBe('notes__open');
  });

  it('keeps only letters, digits, underscores and hyphens, at most 64 of them', () => {
    const long = `acme.${'x'.repeat(80)}.open`;
    const name = toolFor(command({ id: long })).name;

    expect(name).toMatch(/^[A-Za-z0-9_-]{1,64}$/);
    expect(toolFor(command({ id: 'acme/odd name' })).name).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(toolFor(command({ id: `${long}2` })).name).not.toBe(name);
  });

  it('describes it by the description where there is one', () => {
    expect(toolFor(command({ description: 'Opens a note' })).description).toBe(
      'Opens a note',
    );
  });

  it('falls back to the title rather than leaving an unpickable empty description', () => {
    expect(toolFor(command()).description).toBe('Open note');
  });

  it("carries what the command says an agent's word is enough for", () => {
    const tool = toolFor({
      id: 'notes.delete',
      title: 'Delete',
      description: 'Deletes a note',
      agentConsent: 'ask-always',
    });

    expect(tool.metadata).toEqual({ agentConsent: 'ask-always' });
  });

  it('carries no metadata at all for a command that says nothing', () => {
    expect('metadata' in toolFor({ id: 'notes.open', title: 'Open' })).toBe(
      false,
    );
  });

  it('gives a command with no arguments an empty object schema, not a missing one', () => {
    expect(toolFor(command()).parameters).toEqual({
      type: 'object',
      properties: {},
      required: [],
    });
  });

  it('maps every declared kind to its schema fragment', () => {
    const tool = toolFor(
      command({
        arguments: [
          { name: 'path', kind: 'text', description: 'Where', required: true },
          { name: 'count', kind: 'number', description: 'How many' },
          { name: 'pinned', kind: 'boolean', description: 'Pin it' },
          {
            name: 'mode',
            kind: 'choice',
            choices: ['preview', 'permanent'],
            description: 'How to open it',
          },
        ],
      }),
    );

    expect(tool.parameters).toEqual({
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Where' },
        count: { type: 'number', description: 'How many' },
        pinned: { type: 'boolean', description: 'Pin it' },
        mode: {
          type: 'string',
          enum: ['preview', 'permanent'],
          description: 'How to open it',
        },
      },
      required: ['path'],
    });
  });

  it('maps a list to an array of whichever kind it holds', () => {
    const tool = toolFor(
      command({
        arguments: [
          { name: 'tags', kind: 'text', description: 'Labels', list: true },
          {
            name: 'modes',
            kind: 'choice',
            choices: ['a', 'b'],
            description: 'Modes',
            list: true,
            required: true,
          },
        ],
      }),
    );

    expect(tool.parameters).toEqual({
      type: 'object',
      properties: {
        tags: {
          type: 'array',
          description: 'Labels',
          items: { type: 'string' },
        },
        modes: {
          type: 'array',
          description: 'Modes',
          items: { type: 'string', enum: ['a', 'b'] },
        },
      },
      required: ['modes'],
    });
  });
});

describe('toolsFor', () => {
  it('never offers two commands under the same name', () => {
    const tools = toolsFor([command({ id: 'a.b' }), command({ id: 'a__b' })]);

    expect(tools.map((tool) => tool.name)).toEqual(['a__b']);
  });

  it('keeps the order the workbench gave', () => {
    const tools = toolsFor([
      command({ id: 'a.one' }),
      command({ id: 'b.two' }),
    ]);

    expect(tools.map((tool) => tool.name)).toEqual(['a__one', 'b__two']);
  });

  it('describes nothing where there is nothing to describe', () => {
    expect(toolsFor([])).toEqual([]);
  });
});

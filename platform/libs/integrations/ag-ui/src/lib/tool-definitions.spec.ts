import { InvocableCommand } from '@loomweaver/plugin-sdk';
import { toolFor, toolsFor } from './tool-definitions';

function command(over: Partial<InvocableCommand> = {}): InvocableCommand {
  return { id: 'notes.open', title: 'Open note', ...over };
}

describe('toolFor', () => {
  it('names the tool by the command id, so a call names the identity the workbench knows', () => {
    expect(toolFor(command()).name).toBe('notes.open');
  });

  it('describes it by the description where there is one', () => {
    expect(toolFor(command({ description: 'Opens a note' })).description).toBe(
      'Opens a note',
    );
  });

  it('falls back to the title rather than leaving an unpickable empty description', () => {
    expect(toolFor(command()).description).toBe('Open note');
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
  it('keeps the order the workbench gave', () => {
    const tools = toolsFor([
      command({ id: 'a.one' }),
      command({ id: 'b.two' }),
    ]);

    expect(tools.map((tool) => tool.name)).toEqual(['a.one', 'b.two']);
  });

  it('describes nothing where there is nothing to describe', () => {
    expect(toolsFor([])).toEqual([]);
  });
});

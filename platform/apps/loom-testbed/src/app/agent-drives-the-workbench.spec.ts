import { ErrorHandler, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { EventType, type BaseEvent } from '@ag-ui/core';
import { commandTools, type CommandTools } from '@loomweaver/ag-ui';
import { ANONYMOUS, type Plugin, type PluginContext } from '@loomweaver/plugin-sdk';
import {
  AUTH_SOURCE,
  COMMAND_INVOKER,
  CommandInvocationService,
  PluginRuntime,
  provideCapabilityGrants,
  providePlugins,
} from '@loomweaver/shell';

const AGENT = 'agent-plugin';
const NOTES = 'notes-plugin';

function event(type: EventType, fields: Record<string, unknown>): BaseEvent {
  return { type, ...fields } as unknown as BaseEvent;
}

describe('an agent driving the workbench end to end', () => {
  let opened: string[];
  let agentCtx: PluginContext;

  const notes: Plugin = {
    manifest: { id: NOTES, capabilities: ['contributions'] },
    activate: (ctx) => {
      ctx.registerCommand({
        id: 'notes.open',
        title: 'Open note',
        description: 'Opens the note at a path',
        callable: true,
        answers: 'The path it opened',
        arguments: [
          { name: 'path', kind: 'text', description: 'Where', required: true },
        ],
        run: (_context, args) => {
          const path = String(args?.['path']);
          opened.push(path);
          return path;
        },
      });
      ctx.registerCommand({
        id: 'notes.secret',
        title: 'Secret',
        run: () => void opened.push('secret'),
      });
    },
  };

  const agent: Plugin = {
    manifest: { id: AGENT, capabilities: ['automation'] },
    activate: (ctx) => {
      agentCtx = ctx;
    },
  };

  function compose(granted: readonly string[] = ['automation']): CommandTools {
    TestBed.configureTestingModule({
      providers: [
        { provide: AUTH_SOURCE, useValue: signal(ANONYMOUS) },
        {
          provide: TranslocoService,
          useValue: {
            translate: (key: string) => key,
          } as unknown as TranslocoService,
        },
        { provide: COMMAND_INVOKER, useExisting: CommandInvocationService },
        provideCapabilityGrants({
          [NOTES]: ['contributions'],
          [AGENT]: granted as never,
        }),
        providePlugins(notes, agent),
      ],
    });
    TestBed.inject(ErrorHandler);
    TestBed.inject(PluginRuntime).activateAll();
    return commandTools(agentCtx);
  }

  async function call(
    tools: CommandTools,
    id: string,
    name: string,
    json?: string,
  ) {
    await tools.receive(
      event(EventType.TOOL_CALL_START, { toolCallId: id, toolCallName: name }),
    );
    if (json !== undefined) {
      await tools.receive(
        event(EventType.TOOL_CALL_ARGS, { toolCallId: id, delta: json }),
      );
    }
    return tools.receive(event(EventType.TOOL_CALL_END, { toolCallId: id }));
  }

  beforeEach(() => {
    opened = [];
  });

  it('offers what the workbench offers, and nothing its author did not open', () => {
    expect(compose().list()).toEqual([
      {
        name: 'notes.open',
        description: 'Opens the note at a path',
        parameters: {
          type: 'object',
          properties: { path: { type: 'string', description: 'Where' } },
          required: ['path'],
        },
      },
    ]);
  });

  it('runs what the agent asks for, through the workbench itself', async () => {
    const answer = await call(
      compose(),
      'c1',
      'notes.open',
      '{"path":"inbox/today"}',
    );

    expect(opened).toEqual(['inbox/today']);
    expect(answer).toEqual({
      id: 'tool-c1',
      role: 'tool',
      toolCallId: 'c1',
      content: 'inbox/today',
    });
  });

  it('refuses a command whose author never opened it, without running it', async () => {
    const answer = await call(compose(), 'c2', 'notes.secret');

    expect(opened).toEqual([]);
    expect(answer?.error).toContain('did not run');
    expect(answer?.content).toBe('');
  });

  it('reaches nothing at all without the automation grant', async () => {
    const tools = compose([]);
    const answer = await call(tools, 'c3', 'notes.open', '{"path":"a"}');

    expect(tools.list()).toEqual([]);
    expect(opened).toEqual([]);
    expect(answer?.error).toContain('did not run');
  });

  it('refuses an argument the command does not declare, before the command runs', async () => {
    const answer = await call(
      compose(),
      'c4',
      'notes.open',
      '{"path":"a","colour":"red"}',
    );

    expect(opened).toEqual([]);
    expect(answer?.error).toContain('did not run');
  });

  it('stops at the hook, so a confirmation can sit in front of the workbench', async () => {
    compose();
    const tools = commandTools(agentCtx, {
      before: (pending) =>
        pending.args['path'] === 'inbox/today'
          ? { decision: 'run' }
          : { decision: 'decline', reason: 'the user did not confirm it.' },
    });

    const answer = await call(tools, 'c5', 'notes.open', '{"path":"elsewhere"}');

    expect(opened).toEqual([]);
    expect(answer?.error).toContain('did not confirm');
  });
});

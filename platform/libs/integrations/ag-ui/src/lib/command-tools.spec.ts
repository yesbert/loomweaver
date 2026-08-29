import { EventType, type BaseEvent } from '@ag-ui/core';
import type {
  CommandArguments,
  CommandOutcome,
  InvocableCommand,
} from '@loomweaver/plugin-sdk';
import {
  commandTools,
  type CommandAccess,
  type CommandToolOptions,
} from './command-tools';

const OPEN: InvocableCommand = {
  id: 'notes.open',
  title: 'Open note',
  description: 'Opens a note',
  arguments: [
    { name: 'path', kind: 'text', description: 'Where', required: true },
  ],
};

const ANSWERED: CommandOutcome = { outcome: 'answered', value: 'opened' };

function access(
  outcome: CommandOutcome = ANSWERED,
  commands: readonly InvocableCommand[] = [OPEN],
) {
  const invoked: { id: string; args?: CommandArguments }[] = [];
  const ctx: CommandAccess = {
    invocableCommands: () => commands,
    invokeCommand: (id, args) => {
      invoked.push({ id, args });
      return Promise.resolve(outcome);
    },
  };
  return { ctx, invoked };
}

function event(type: EventType, fields: Record<string, unknown>): BaseEvent {
  return { type, ...fields } as unknown as BaseEvent;
}

async function play(
  tools: ReturnType<typeof commandTools>,
  events: readonly BaseEvent[],
) {
  const answers = [];
  for (const one of events) {
    const answer = await tools.receive(one);
    if (answer) {
      answers.push(answer);
    }
  }
  return answers;
}

function streamedCall(id: string, name: string, json: string): BaseEvent[] {
  return [
    event(EventType.TOOL_CALL_START, { toolCallId: id, toolCallName: name }),
    event(EventType.TOOL_CALL_ARGS, { toolCallId: id, delta: json.slice(0, 3) }),
    event(EventType.TOOL_CALL_ARGS, { toolCallId: id, delta: json.slice(3) }),
    event(EventType.TOOL_CALL_END, { toolCallId: id }),
  ];
}

describe('commandTools list', () => {
  it('offers what the workbench offers', () => {
    const { ctx } = access();

    expect(commandTools(ctx).list().map((tool) => tool.name)).toEqual([
      'notes.open',
    ]);
  });

  it('reads the list again for each run rather than keeping it', () => {
    let commands: readonly InvocableCommand[] = [OPEN];
    const tools = commandTools({
      invocableCommands: () => commands,
      invokeCommand: () => Promise.resolve({ outcome: 'answered' }),
    });

    expect(tools.list()).toHaveLength(1);
    commands = [];
    expect(tools.list()).toHaveLength(0);
  });
});

describe('commandTools receive', () => {
  it('assembles a streamed call and runs it through the workbench', async () => {
    const { ctx, invoked } = access();
    const answers = await play(
      commandTools(ctx),
      streamedCall('c1', 'notes.open', '{"path":"inbox"}'),
    );

    expect(invoked).toEqual([{ id: 'notes.open', args: { path: 'inbox' } }]);
    expect(answers).toEqual([
      { id: 'tool-c1', role: 'tool', toolCallId: 'c1', content: 'opened' },
    ]);
  });

  it('answers only when the call is complete', async () => {
    const { ctx } = access();
    const tools = commandTools(ctx);
    const events = streamedCall('c1', 'notes.open', '{"path":"a"}');

    expect(await tools.receive(events[0])).toBeNull();
    expect(await tools.receive(events[1])).toBeNull();
    expect(await tools.receive(events[2])).toBeNull();
    expect(await tools.receive(events[3])).not.toBeNull();
  });

  it('serialises an answer that is not a string', async () => {
    const { ctx } = access({ outcome: 'answered', value: { rows: 3 } });
    const [answer] = await play(
      commandTools(ctx),
      streamedCall('c1', 'notes.open', '{"path":"a"}'),
    );

    expect(answer.content).toBe('{"rows":3}');
    expect(answer.error).toBeUndefined();
  });

  it('says the command ran where it declares no answer', async () => {
    const { ctx } = access({ outcome: 'answered' });
    const [answer] = await play(
      commandTools(ctx),
      streamedCall('c1', 'notes.open', '{"path":"a"}'),
    );

    expect(answer.content).toBe('The command ran.');
    expect(answer.error).toBeUndefined();
  });

  it('tells a refusal from a failure, and both from an answer', async () => {
    const refused = access({
      outcome: 'refused',
      reason: 'unavailable',
      message: 'No such command is available here.',
    });
    const failed = access({ outcome: 'failed', message: 'it broke' });

    const [refusal] = await play(
      commandTools(refused.ctx),
      streamedCall('c1', 'notes.open', '{"path":"a"}'),
    );
    const [failure] = await play(
      commandTools(failed.ctx),
      streamedCall('c2', 'notes.open', '{"path":"a"}'),
    );

    expect(refusal.error).toContain('did not run');
    expect(failure.error).toContain('ran and failed');
    expect(refusal.error).not.toEqual(failure.error);
    expect(refusal.content).toBe('');
  });

  it('refuses arguments that did not arrive as readable JSON, without reaching the workbench', async () => {
    const { ctx, invoked } = access();
    const [answer] = await play(
      commandTools(ctx),
      streamedCall('c1', 'notes.open', '{"path":'),
    );

    expect(answer.error).toContain('readable JSON');
    expect(invoked).toEqual([]);
  });

  it('leaves a tool the workbench does not know to the workbench to refuse', async () => {
    const { ctx, invoked } = access({
      outcome: 'refused',
      reason: 'unavailable',
      message: 'nothing here',
    });
    const [answer] = await play(
      commandTools(ctx),
      streamedCall('c1', 'nothing.here', '{}'),
    );

    expect(invoked).toEqual([{ id: 'nothing.here', args: {} }]);
    expect(answer.error).toContain('did not run');
  });

  it('keeps two interleaved calls apart', async () => {
    const { ctx, invoked } = access();
    const tools = commandTools(ctx);

    await tools.receive(
      event(EventType.TOOL_CALL_START, {
        toolCallId: 'a',
        toolCallName: 'notes.open',
      }),
    );
    await tools.receive(
      event(EventType.TOOL_CALL_START, {
        toolCallId: 'b',
        toolCallName: 'notes.open',
      }),
    );
    await tools.receive(
      event(EventType.TOOL_CALL_ARGS, {
        toolCallId: 'a',
        delta: '{"path":"first"}',
      }),
    );
    await tools.receive(
      event(EventType.TOOL_CALL_ARGS, {
        toolCallId: 'b',
        delta: '{"path":"second"}',
      }),
    );
    const first = await tools.receive(
      event(EventType.TOOL_CALL_END, { toolCallId: 'a' }),
    );
    const second = await tools.receive(
      event(EventType.TOOL_CALL_END, { toolCallId: 'b' }),
    );

    expect(invoked.map((call) => call.args)).toEqual([
      { path: 'first' },
      { path: 'second' },
    ]);
    expect([first?.toolCallId, second?.toolCallId]).toEqual(['a', 'b']);
  });

  it('ignores an event that is not part of a tool call', async () => {
    const { ctx, invoked } = access();

    expect(
      await commandTools(ctx).receive(
        event(EventType.TEXT_MESSAGE_CONTENT, { delta: 'hello' }),
      ),
    ).toBeNull();
    expect(invoked).toEqual([]);
  });

  it('ignores a closing event for a call it never saw open', async () => {
    const { ctx } = access();

    expect(
      await commandTools(ctx).receive(
        event(EventType.TOOL_CALL_END, { toolCallId: 'ghost' }),
      ),
    ).toBeNull();
  });
});

describe('commandTools with the convenience form', () => {
  it('assembles a call carried by chunks', async () => {
    const { ctx, invoked } = access();
    const answers = await play(commandTools(ctx), [
      event(EventType.TOOL_CALL_CHUNK, {
        toolCallId: 'c1',
        toolCallName: 'notes.open',
        delta: '{"path":',
      }),
      event(EventType.TOOL_CALL_CHUNK, { delta: '"inbox"}' }),
      event(EventType.RUN_FINISHED, {}),
    ]);

    expect(invoked).toEqual([{ id: 'notes.open', args: { path: 'inbox' } }]);
    expect(answers).toHaveLength(1);
  });

  it('closes the previous call when a new one starts', async () => {
    const { ctx, invoked } = access();
    const answers = await play(commandTools(ctx), [
      event(EventType.TOOL_CALL_CHUNK, {
        toolCallId: 'c1',
        toolCallName: 'notes.open',
        delta: '{"path":"a"}',
      }),
      event(EventType.TOOL_CALL_CHUNK, {
        toolCallId: 'c2',
        toolCallName: 'notes.open',
        delta: '{"path":"b"}',
      }),
    ]);

    expect(invoked).toEqual([{ id: 'notes.open', args: { path: 'a' } }]);
    expect(answers.map((answer) => answer.toolCallId)).toEqual(['c1']);
  });

  it('closes what is still open when the run ends, and answers nothing where nothing is', async () => {
    const { ctx, invoked } = access();
    const tools = commandTools(ctx);

    expect(await tools.flush()).toBeNull();

    await tools.receive(
      event(EventType.TOOL_CALL_START, {
        toolCallId: 'c1',
        toolCallName: 'notes.open',
      }),
    );
    const answer = await tools.receive(event(EventType.RUN_ERROR, {}));

    expect(answer?.toolCallId).toBe('c1');
    expect(invoked).toHaveLength(1);
  });
});

describe('commandTools hook', () => {
  function withHook(before: CommandToolOptions['before']) {
    const { ctx, invoked } = access();
    return { tools: commandTools(ctx, { before }), invoked };
  }

  it('runs the call when nothing is supplied', async () => {
    const { ctx, invoked } = access();
    await play(commandTools(ctx), streamedCall('c1', 'notes.open', '{"path":"a"}'));

    expect(invoked).toHaveLength(1);
  });

  it('sees the assembled call before it runs', async () => {
    const seen: unknown[] = [];
    const { tools } = withHook((call) => {
      seen.push(call);
      return { decision: 'run' };
    });

    await play(tools, streamedCall('c1', 'notes.open', '{"path":"a"}'));

    expect(seen).toEqual([
      { toolCallId: 'c1', commandId: 'notes.open', args: { path: 'a' } },
    ]);
  });

  it('declines without reaching the workbench, and says why', async () => {
    const { tools, invoked } = withHook(() => ({
      decision: 'decline',
      reason: 'the user said no.',
    }));

    const [answer] = await play(
      tools,
      streamedCall('c1', 'notes.open', '{"path":"a"}'),
    );

    expect(invoked).toEqual([]);
    expect(answer.error).toContain('the user said no.');
  });

  it('answers the call itself without reaching the workbench', async () => {
    const { tools, invoked } = withHook(() => ({
      decision: 'answer',
      content: 'handled here',
    }));

    const [answer] = await play(
      tools,
      streamedCall('c1', 'notes.open', '{"path":"a"}'),
    );

    expect(invoked).toEqual([]);
    expect(answer.content).toBe('handled here');
    expect(answer.error).toBeUndefined();
  });

  it('may be asynchronous, which is what a confirmation needs', async () => {
    const { tools, invoked } = withHook(
      async () => await { decision: 'run' as const },
    );

    await play(tools, streamedCall('c1', 'notes.open', '{"path":"a"}'));

    expect(invoked).toHaveLength(1);
  });

  it('cannot widen: letting a call through still leaves the workbench to refuse it', async () => {
    const { ctx, invoked } = access({
      outcome: 'refused',
      reason: 'unavailable',
      message: 'not reachable here',
    });
    const tools = commandTools(ctx, { before: () => ({ decision: 'run' }) });

    const [answer] = await play(
      tools,
      streamedCall('c1', 'notes.open', '{"path":"a"}'),
    );

    expect(invoked).toHaveLength(1);
    expect(answer.error).toContain('did not run');
  });
});

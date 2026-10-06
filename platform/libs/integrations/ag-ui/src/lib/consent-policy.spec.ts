import { EventType, type BaseEvent } from '@ag-ui/core';
import type {
  AgentConsent,
  CommandOutcome,
  InvocableCommand,
} from '@loomweaver/plugin-sdk';
import { commandTools, type CommandAccess, type PendingToolCall } from './command-tools';
import { consentPolicy } from './consent-policy';

function command(id: string, agentConsent?: AgentConsent): InvocableCommand {
  return { id, title: id, ...(agentConsent && { agentConsent }) };
}

const COMMANDS = [
  command('notes.read', 'allow'),
  command('notes.list'),
  command('notes.archive', 'ask'),
  command('notes.delete', 'ask-always'),
  command('notes.purge', 'never'),
];

function connection(before?: (call: PendingToolCall) => Promise<unknown>) {
  const ran: string[] = [];
  const ctx: CommandAccess = {
    invocableCommands: () => COMMANDS,
    invokeCommand: (id) => {
      ran.push(id);
      return Promise.resolve({ outcome: 'answered' } as CommandOutcome);
    },
  };
  const tools = commandTools(ctx, before ? { before: before as never } : {});
  let calls = 0;
  const call = async (name: string) => {
    calls += 1;
    const id = `call-${calls}`;
    const events = [
      { type: EventType.TOOL_CALL_START, toolCallId: id, toolCallName: name },
      { type: EventType.TOOL_CALL_ARGS, toolCallId: id, delta: '{}' },
      { type: EventType.TOOL_CALL_END, toolCallId: id },
    ] as unknown as BaseEvent[];
    let answer = null;
    for (const event of events) {
      answer = (await tools.receive(event)) ?? answer;
    }
    return answer;
  };
  return { ran, call };
}

function asking(answer: boolean) {
  const asked: string[] = [];
  const confirm = (call: PendingToolCall) => {
    asked.push(call.commandId);
    return Promise.resolve(answer);
  };
  return { asked, confirm };
}

describe('consentPolicy', () => {
  it('asks nothing where the product applies no policy, and the command runs as before', async () => {
    const { ran, call } = connection();

    await call('notes.archive');
    await call('notes.delete');

    expect(ran).toEqual(['notes.archive', 'notes.delete']);
  });

  it('asks once per connection for a command that asks first, remembering the yes', async () => {
    const { asked, confirm } = asking(true);
    const { ran, call } = connection(consentPolicy(confirm));

    await call('notes.archive');
    await call('notes.archive');

    expect(asked).toEqual(['notes.archive']);
    expect(ran).toEqual(['notes.archive', 'notes.archive']);
  });

  it('remembers nothing across connections, each with its own policy', async () => {
    const { asked, confirm } = asking(true);

    await connection(consentPolicy(confirm)).call('notes.archive');
    await connection(consentPolicy(confirm)).call('notes.archive');

    expect(asked).toEqual(['notes.archive', 'notes.archive']);
  });

  it('asks every time for a command that asks every time', async () => {
    const { asked, confirm } = asking(true);
    const { ran, call } = connection(consentPolicy(confirm));

    await call('notes.delete');
    await call('notes.delete');

    expect(asked).toEqual(['notes.delete', 'notes.delete']);
    expect(ran).toEqual(['notes.delete', 'notes.delete']);
  });

  it('declines a command not to be run on an agent word, saying so, and asks nobody', async () => {
    const { asked, confirm } = asking(true);
    const { ran, call } = connection(consentPolicy(confirm));

    const answer = await call('notes.purge');

    expect(asked).toEqual([]);
    expect(ran).toEqual([]);
    expect(answer?.error).toContain("may not run this one on its own word");
  });

  it('declines on a no, saying so, and does not run the command or remember anything', async () => {
    const { asked, confirm } = asking(false);
    const { ran, call } = connection(consentPolicy(confirm));

    const answer = await call('notes.archive');
    await call('notes.archive');

    expect(answer?.error).toContain('said no');
    expect(asked).toEqual(['notes.archive', 'notes.archive']);
    expect(ran).toEqual([]);
  });

  it('lets a command through that allows it or says nothing, asking nobody', async () => {
    const { asked, confirm } = asking(false);
    const { ran, call } = connection(consentPolicy(confirm));

    await call('notes.read');
    await call('notes.list');

    expect(asked).toEqual([]);
    expect(ran).toEqual(['notes.read', 'notes.list']);
  });

  it('takes the product wording for what it tells the agent', async () => {
    const { confirm } = asking(false);
    const { call } = connection(
      consentPolicy(confirm, { never: 'Not on your word.', refused: 'The user declined.' }),
    );

    expect((await call('notes.purge'))?.error).toContain('Not on your word.');
    expect((await call('notes.archive'))?.error).toContain('The user declined.');
  });
});

import type {
  CommandArguments,
  CommandOutcome,
  InvocableCommand,
  PluginContext,
} from '@loomweaver/plugin-sdk';
import { agentRunner } from './agent-runner';
import { BEATS, type Beat, type BeatId } from './agent-script';
import { conversation } from './conversation';

interface Workbench {
  readonly invoked: { id: string; args?: CommandArguments }[];
  readonly asked: string[][];
  offers: string[];
  answer: CommandOutcome;
  confirms: boolean;
}

function beat(id: BeatId): Beat {
  return BEATS.find((one) => one.id === id) as Beat;
}

function workbench(offers: string[]): Workbench {
  const bench: Workbench = {
    invoked: [],
    asked: [],
    offers,
    answer: { outcome: 'answered', value: 'done' },
    confirms: true,
  };

  const ctx = {
    invocableCommands: (): readonly InvocableCommand[] => {
      bench.asked.push([...bench.offers]);
      return bench.offers.map((id) => ({ id, title: id }));
    },
    invokeCommand: async (id: string, args?: CommandArguments) => {
      bench.invoked.push({ id, args });
      return bench.answer;
    },
    ui: { confirm: async () => bench.confirms },
  } as unknown as PluginContext;

  agentRunner.bind(ctx);
  agentRunner.speaksWith((key, params) =>
    params ? `${key}:${JSON.stringify(params)}` : key,
  );
  return bench;
}

function spoke(lines: readonly string[], key: string): boolean {
  return lines.some((text) => text.startsWith(key));
}

async function ask(one: Beat): Promise<readonly string[]> {
  const from = conversation.lines().length;
  const run = agentRunner.ask(one);
  await vi.advanceTimersByTimeAsync(30_000);
  await run;
  return conversation.lines().slice(from).map((line) => line.text);
}

describe('the demo agent driving the workbench', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    agentRunner.unbind();
  });

  it('puts the command a beat names to the workbench, with the arguments it streamed', async () => {
    const bench = workbench(['quotes.open']);

    await ask(beat('openQuote'));

    expect(bench.invoked).toEqual([
      { id: 'quotes.open', args: { number: 'Q-0007' } },
    ]);
  });

  it('asks what it may run at the start of every run, so a command that appears later is offered rather than missed', async () => {
    const bench = workbench(['quotes.open']);

    const first = await ask(beat('margin'));
    bench.offers = ['quotes.open', 'quotes.margin'];
    const second = await ask(beat('margin'));

    expect(bench.asked).toEqual([
      ['quotes.open'],
      ['quotes.open', 'quotes.margin'],
    ]);
    expect(spoke(first, 'agent.notOffered')).toBe(true);
    expect(spoke(second, 'agent.notOffered')).toBe(false);
  });

  it('leaves a consequential command unasked when the confirmation says no, and asks it when it says yes', async () => {
    const bench = workbench(['quotes.send']);
    bench.confirms = false;

    const declined = await ask(beat('sendQuote'));
    expect(bench.invoked).toEqual([]);
    expect(spoke(declined, 'agent.result.refused')).toBe(true);

    bench.confirms = true;
    await ask(beat('sendQuote'));
    expect(bench.invoked.map((call) => call.id)).toEqual(['quotes.send']);
  });

  it('carries a refusal back as a refusal rather than as an answer, both ways round', async () => {
    const bench = workbench(['quotes.margin']);
    bench.answer = { outcome: 'refused', reason: 'unavailable', message: 'no' };

    const refused = await ask(beat('margin'));
    expect(spoke(refused, 'agent.result.refused')).toBe(true);
    expect(spoke(refused, 'agent.beat.margin.refused')).toBe(true);

    bench.answer = { outcome: 'answered', value: '{"margin":"1"}' };
    const answered = await ask(beat('margin'));
    expect(spoke(answered, 'agent.beat.margin.closes')).toBe(true);
  });
});

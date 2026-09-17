import * as ts from 'typescript';
import { RUNTIME_NOTE, validateCommands } from './commands';

const PLUGIN = `
export const plugin = {
  activate(ctx) {
    ctx.registerCommand({
      id: 'tickets.open',
      title: 'tickets.open.title',
      description: 'tickets.open.description',
      arguments: [{ name: 'number', kind: 'text', required: true, description: 'tickets.open.number' }],
      answers: 'tickets.open.answers',
      callable: true,
      run: (_context, args) => ({ number: String(args?.['number']) }),
    });
    ctx.registerCommand({
      id: 'tickets.hello',
      title: 'tickets.hello',
      callable: true,
      run: () => ctx.ui.toast({ message: 'hi' }),
    });
    ctx.registerCommand({
      id: 'tickets.delete',
      title: 'tickets.delete',
      description: 'tickets.delete.description',
      callable: true,
      agentConsent: 'ask-always' as const,
      run: () => store.delete(),
    });
    ctx.registerCommand({
      id: 'tickets.publish',
      title: 'tickets.publish',
      description: 'tickets.publish.description',
      callable: true,
      agentConsent: 'aks',
      run: () => store.publish(),
    });
    ctx.registerCommand({
      id: 'tickets.assign',
      title: 'tickets.assign',
      description: 'tickets.assign.description',
      arguments: [{ name: 'to', kind: 'choice', choices: ['dana', 'lee'] }],
      callable: true,
      run: (_context, args) => {
        const result = { to: args?.['to'] };
        return result;
      },
    });
    ctx.registerCommand({
      id: 'tickets.reset',
      title: 'tickets.reset',
      run: () => store.reset(),
    });
    ctx.registerCommand({ ...shared, id: 'tickets.spread' });
  },
};
`;

function findings() {
  return validateCommands([{ path: 'src/lib/plugin/tickets.plugin.ts', text: PLUGIN }], ts);
}

function by(code: string) {
  return findings().filter((finding) => finding.code === code);
}

describe('validateCommands', () => {
  it('reports the complete command as offered, with its argument and answer', () => {
    const [offered] = by('command.offered');
    expect(offered.message).toBe('tickets.open: offered to an agent, with 1 described argument and a declared answer.');
    expect(offered.path).toBe('src/lib/plugin/tickets.plugin.ts:4');
    expect(offered.level).toBe('info');
  });

  it('warns on a callable command without a description, and only there', () => {
    const [missing] = by('command.description');
    expect(missing.level).toBe('warning');
    expect(missing.message).toContain('tickets.hello: offered to an agent without a description');
    expect(findings().filter((finding) => finding.level === 'warning')).toHaveLength(1);
  });

  it('names the argument and the answer an agent would have to guess at', () => {
    expect(by('command.argument')[0].message).toContain('tickets.assign: argument "to" has no description');
    expect(by('command.answers')[0].message).toContain('tickets.assign: run returns a value but declares no answers');
    expect(by('command.argument')[0].level).toBe('info');
  });

  it("says what each offered command states about an agent's word, including nothing", () => {
    const lines = new Map(
      by('command.consent').map((finding) => [
        finding.message.split(':', 1)[0],
        finding.message,
      ]),
    );

    expect(lines.get('tickets.delete')).toContain(
      'says the person is asked every time',
    );
    expect(lines.get('tickets.open')).toContain(
      "says nothing about whether an agent's word is enough",
    );
    expect(lines.get('tickets.publish')).toContain(
      'declares "aks" about an agent\'s word, which is none of',
    );
    expect(by('command.consent').every((one) => one.level === 'info')).toBe(
      true,
    );
  });

  it('says nothing of the kind about a command no agent is offered', () => {
    expect(
      by('command.consent').some((one) => one.message.startsWith('tickets.reset')),
    ).toBe(false);
  });

  it('never guesses a consequence from an id or a title', () => {
    const about = findings().filter((finding) =>
      finding.message.startsWith('tickets.delete'),
    );

    expect(about.map((finding) => finding.code)).toEqual([
      'command.offered',
      'command.consent',
    ]);
    expect(about.some((finding) => finding.level === 'warning')).toBe(false);
  });

  it('lists a command that is not callable as information', () => {
    const [closed] = by('command.private');
    expect(closed.level).toBe('info');
    expect(closed.message).toContain('tickets.reset: not offered to an agent');
  });

  it('says when a registration could not be read rather than passing it', () => {
    const [unreadable] = by('command.unreadable');
    expect(unreadable.level).toBe('info');
    expect(unreadable.message).toContain('spreads another value');
  });

  it('ends every report with the limit of what it judged', () => {
    const all = findings();
    expect(all.at(-1)).toEqual({ level: 'info', code: 'commands.runtime', message: RUNTIME_NOTE });
    expect(validateCommands([], ts)).toEqual([{ level: 'info', code: 'commands.runtime', message: RUNTIME_NOTE }]);
  });
});

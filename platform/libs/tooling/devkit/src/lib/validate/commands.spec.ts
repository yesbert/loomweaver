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

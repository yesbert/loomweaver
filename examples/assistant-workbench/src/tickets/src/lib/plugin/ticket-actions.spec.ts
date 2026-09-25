import type { PluginContext } from '@loomweaver/plugin-sdk';
import { ticketStore } from '../tickets/ticket-store';
import { ticketActions } from './ticket-actions';

describe('ticketActions', () => {
  const shown: string[] = [];

  beforeEach(() => {
    ticketStore.reset();
    shown.length = 0;
    ticketActions.bind({
      openContentTab: (tab: { path: string }) => {
        shown.push(tab.path);
      },
    } as unknown as PluginContext);
  });

  afterEach(() => ticketActions.unbind());

  it('changes a ticket and shows it, whichever trigger asked', () => {
    expect(ticketActions.assign('T-1041', 'dana').assignee).toBe('dana');
    expect(ticketActions.reply('t-1042', 'On it.').replies).toBe(1);
    expect(ticketActions.setStatus('T-1043', 'done').status).toBe('done');

    expect(shown).toEqual(['tickets/T-1041', 'tickets/T-1042', 'tickets/T-1043']);
  });
});

import { STATUSES, statusKey, ticketDetail, ticketStore } from './ticket-store';

describe('ticketStore', () => {
  beforeEach(() => ticketStore.reset());

  it('lists every ticket, or only those in one status', () => {
    expect(ticketStore.list()).toHaveLength(6);
    ticketStore.assign('T-1041', 'dana');
    expect(ticketStore.list('in progress').map((one) => one.number)).toEqual(['T-1041']);
  });

  it('finds a ticket by number, whatever the case', () => {
    expect(ticketStore.get('t-1043').subject).toContain('CSV');
  });

  it('refuses a number it does not know', () => {
    expect(() => ticketStore.get('T-9')).toThrow('There is no ticket T-9.');
  });

  it('looks a number up without refusing one it does not know', () => {
    expect(ticketStore.find(' t-1043 ')?.number).toBe('T-1043');
    expect(ticketStore.find('T-9')).toBeUndefined();
  });

  it('keeps a reply on the ticket', () => {
    expect(ticketStore.reply('T-1041', 'On it.').replies).toBe(1);
    expect(ticketStore.get('T-1041').replies[0].text).toBe('On it.');
  });

  it('details a ticket with its replies as the customer reads them', () => {
    ticketStore.reply('T-1041', 'On it.');
    expect(ticketDetail(ticketStore.get('T-1041')).replies).toEqual(['On it.']);
  });

  it('names each status by its translation key', () => {
    expect(STATUSES.map((status) => statusKey(status))).toEqual([
      'tickets.states.open',
      'tickets.states.inProgress',
      'tickets.states.done',
    ]);
  });
});
